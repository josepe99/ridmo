import { describe, expect, it } from "vitest"
import nextConfig from "../next.config.mjs"
import tailwindConfig from "../tailwind.config"

// Static contracts: cheap checks that catch config regressions without booting Next.
describe("next.config", () => {
  it("keeps allowing legacy Cloudinary images over https", () => {
    const patterns = nextConfig.images?.remotePatterns ?? []

    expect(patterns).toContainEqual(
      expect.objectContaining({ protocol: "https", hostname: "res.cloudinary.com" })
    )
  })

  it("serves modern image formats", () => {
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"])
  })

  it("allows MinIO media images over https and the local dev MinIO over http", () => {
    const patterns = nextConfig.images?.remotePatterns ?? []

    expect(patterns).toContainEqual(
      expect.objectContaining({ protocol: "https", hostname: "media.ridmo.com.py" })
    )
    expect(patterns).toContainEqual(
      expect.objectContaining({ protocol: "http", hostname: "localhost", port: "9000" })
    )
  })

  it("only allows safe remote image hosts (no wildcard hostnames, http only for localhost)", () => {
    for (const pattern of nextConfig.images?.remotePatterns ?? []) {
      expect(pattern.hostname).not.toContain("*")
      if (pattern.protocol === "http") {
        expect(pattern.hostname).toBe("localhost")
      } else {
        expect(pattern.protocol).toBe("https")
      }
    }
  })

  it("accepts server action payloads big enough for image uploads", () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe("25mb")
  })

  it("exposes responsive image breakpoints in ascending order", () => {
    const { deviceSizes, imageSizes } = nextConfig.images ?? {}

    for (const sizes of [deviceSizes, imageSizes]) {
      expect(sizes).toBeDefined()
      expect([...(sizes ?? [])].sort((a, b) => a - b)).toEqual(sizes)
    }
  })
})

describe("tailwind.config", () => {
  it("scans every source folder that contains class names", () => {
    const content = (tailwindConfig.content ?? []) as string[]

    for (const folder of ["app", "modules", "shared"]) {
      expect(content.some((glob) => glob.includes(`./${folder}/`))).toBe(true)
    }
  })

  it("maps the font families to CSS variables", () => {
    const fonts = tailwindConfig.theme?.extend?.fontFamily as Record<string, string[]>

    expect(fonts.sans).toEqual(["var(--font-sans)"])
    expect(fonts.display).toEqual(["var(--font-display)"])
    expect(fonts.serif).toEqual(["var(--font-serif)"])
  })
})
