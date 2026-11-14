import { describe, expect, it } from "vitest"
import nextConfig from "../next.config.mjs"

describe("next.config security headers", () => {
  it("sets the baseline headers on every route", async () => {
    const rules = await nextConfig.headers?.()
    expect(rules).toHaveLength(1)
    expect(rules?.[0].source).toBe("/:path*")

    const headers = Object.fromEntries((rules?.[0].headers ?? []).map((h) => [h.key, h.value]))
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(headers["X-Frame-Options"]).toBe("DENY")
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["Permissions-Policy"]).toContain("camera=()")
    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=\d+$/)
  })

  it("does not restrict notifications or push (Web Push for admins must keep working)", async () => {
    const rules = await nextConfig.headers?.()
    const policy = rules?.[0].headers.find((h) => h.key === "Permissions-Policy")?.value ?? ""
    expect(policy).not.toMatch(/notifications|push/)
  })

  it("keeps the native argon2 binding out of the server bundle", () => {
    expect(nextConfig.serverExternalPackages).toContain("@node-rs/argon2")
  })

  it("keeps the existing image and build settings", () => {
    expect(nextConfig.images?.remotePatterns).toContainEqual(
      expect.objectContaining({ protocol: "https", hostname: "res.cloudinary.com" })
    )
    expect(nextConfig.typescript?.ignoreBuildErrors).toBe(true)
  })
})
