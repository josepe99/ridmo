import { afterEach, describe, expect, it, vi } from "vitest"

async function loadConfig() {
  vi.resetModules()
  return (await import("./auth.config")).authConfig
}

afterEach(() => vi.unstubAllEnvs())

describe("authConfig (edge-safe half)", () => {
  it("registers no provider when Google credentials are missing", async () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "")
    vi.stubEnv("AUTH_GOOGLE_SECRET", "")
    expect((await loadConfig()).providers).toEqual([])
  })

  it("registers no provider when only one of the two Google credentials is set", async () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "id")
    vi.stubEnv("AUTH_GOOGLE_SECRET", "")
    expect((await loadConfig()).providers).toEqual([])
  })

  it("registers Google when both credentials are set, never allowing dangerous email linking", async () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "id")
    vi.stubEnv("AUTH_GOOGLE_SECRET", "secret")
    const config = await loadConfig()

    expect(config.providers).toHaveLength(1)
    const provider = config.providers[0] as unknown as { id: string; options?: Record<string, unknown>; allowDangerousEmailAccountLinking?: boolean }
    expect(provider.id).toBe("google")
    expect(provider.allowDangerousEmailAccountLinking ?? provider.options?.allowDangerousEmailAccountLinking).not.toBe(true)
  })

  it("uses stateless JWT sessions with a bounded lifetime and our own pages", async () => {
    const config = await loadConfig()
    expect(config.session.strategy).toBe("jwt")
    expect(config.session.maxAge).toBeLessThanOrEqual(60 * 60 * 24 * 30)
    expect(config.pages).toEqual({ signIn: "/sign-in", error: "/sign-in" })
  })

  it("does not set trustHost or force-link accounts anywhere", async () => {
    const config = (await loadConfig()) as Record<string, unknown>
    expect(config.trustHost).toBeUndefined()
    expect(config.allowDangerousEmailAccountLinking).toBeUndefined()
  })

  it("maps the token and session through the pure callbacks (no hash leaks)", async () => {
    const { callbacks } = await loadConfig()
    const token = await callbacks.jwt({
      token: { sub: "u1" },
      user: { id: "u1", role: "ADMIN", passwordHash: "$argon2id$leak" } as never,
    } as never)
    expect(token).toMatchObject({ id: "u1", role: "ADMIN" })
    expect(JSON.stringify(token)).not.toContain("argon2")

    const session = await callbacks.session({
      session: { user: { email: "a@b.co" }, expires: "2099" },
      token,
    } as never)
    expect(session).toMatchObject({ user: { id: "u1", role: "ADMIN" } })
  })
})
