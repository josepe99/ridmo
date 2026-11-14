import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)
vi.mock("./password-hasher", () => ({ verifyPasswordOrDummy: vi.fn() }))
vi.mock("./rate-limiter", () => ({
  checkRateLimit: vi.fn(),
  recordRateLimitHit: vi.fn(),
  resetRateLimit: vi.fn(),
}))

import { authorizeCredentials, LoginRateLimitedError } from "./authorize-credentials"
import { verifyPasswordOrDummy } from "./password-hasher"
import { checkRateLimit, recordRateLimitHit, resetRateLimit } from "./rate-limiter"

const ctx = { ip: "203.0.113.7" }
const creds = { email: " Ana@Example.com ", password: "correct-password-1" }

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  name: "Ana",
  email: "ana@example.com",
  image: null,
  role: "USER",
  passwordHash: "$argon2id$stored",
  disabledAt: null,
  ...overrides,
})

beforeEach(() => {
  resetAuthPrismaMock()
  vi.mocked(verifyPasswordOrDummy).mockReset().mockResolvedValue(true)
  vi.mocked(checkRateLimit).mockReset().mockResolvedValue({ allowed: true })
  vi.mocked(recordRateLimitHit).mockReset().mockResolvedValue(undefined)
  vi.mocked(resetRateLimit).mockReset().mockResolvedValue(undefined)
  authPrismaMock.user.findUnique.mockResolvedValue(dbUser())
})

describe("authorizeCredentials: success", () => {
  it("returns only the safe user fields (no hash) and looks the user up by normalized email", async () => {
    const user = await authorizeCredentials(creds, ctx)

    expect(user).toEqual({ id: "u1", name: "Ana", email: "ana@example.com", image: null, role: "USER" })
    expect(JSON.stringify(user)).not.toMatch(/argon2|passwordHash/)
    expect(authPrismaMock.user.findUnique.mock.calls[0][0].where).toEqual({ email: "ana@example.com" })
    expect(verifyPasswordOrDummy).toHaveBeenCalledWith("$argon2id$stored", "correct-password-1")
  })

  it("resets the per-email counter on success but not the per-IP one", async () => {
    await authorizeCredentials(creds, ctx)
    expect(resetRateLimit).toHaveBeenCalledTimes(1)
    expect(resetRateLimit).toHaveBeenCalledWith("login-email", "ana@example.com")
    expect(recordRateLimitHit).not.toHaveBeenCalled()
  })

  it("carries the DB role, not anything the client sent", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN" }))
    const user = await authorizeCredentials({ ...creds, role: "USER" }, ctx)
    expect(user?.role).toBe("ADMIN")
  })
})

describe("authorizeCredentials: every failure looks the same and counts against both buckets", () => {
  async function expectGenericFailure() {
    await expect(authorizeCredentials(creds, ctx)).resolves.toBeNull()
    expect(recordRateLimitHit).toHaveBeenCalledWith("login-email", "ana@example.com", expect.any(Object))
    expect(recordRateLimitHit).toHaveBeenCalledWith("login-ip", "203.0.113.7", expect.any(Object))
    expect(resetRateLimit).not.toHaveBeenCalled()
  }

  it("wrong password", async () => {
    vi.mocked(verifyPasswordOrDummy).mockResolvedValue(false)
    await expectGenericFailure()
  })

  it("unknown email still runs a (dummy) verification and is counted, so it cannot be enumerated", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    vi.mocked(verifyPasswordOrDummy).mockResolvedValue(false)
    await expectGenericFailure()
    expect(verifyPasswordOrDummy).toHaveBeenCalledTimes(1)
    expect(verifyPasswordOrDummy).toHaveBeenCalledWith(null, "correct-password-1")
  })

  it("Google-only account (no password hash) fails identically", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ passwordHash: null }))
    vi.mocked(verifyPasswordOrDummy).mockResolvedValue(false)
    await expectGenericFailure()
    expect(verifyPasswordOrDummy).toHaveBeenCalledWith(null, "correct-password-1")
  })

  it("a disabled account fails even with the right password", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ disabledAt: new Date() }))
    await expectGenericFailure()
  })

  it("never succeeds if the verifier says no, whatever the stored data looks like", async () => {
    vi.mocked(verifyPasswordOrDummy).mockResolvedValue(false)
    authPrismaMock.user.findUnique.mockResolvedValue(dbUser({ role: "ADMIN" }))
    await expect(authorizeCredentials(creds, ctx)).resolves.toBeNull()
  })
})

describe("authorizeCredentials: input validation", () => {
  it.each([
    [undefined],
    [null],
    ["string"],
    [{}],
    [{ email: "ana@example.com" }],
    [{ email: "ana@example.com", password: "" }],
    [{ email: "not-an-email", password: "x" }],
    [{ email: "ana@example.com", password: "a".repeat(5000) }],
    [{ email: ["ana@example.com"], password: "x" }],
  ])("returns null without touching the database or the verifier for %j", async (input) => {
    await expect(authorizeCredentials(input, ctx)).resolves.toBeNull()
    expect(authPrismaMock.user.findUnique).not.toHaveBeenCalled()
    expect(verifyPasswordOrDummy).not.toHaveBeenCalled()
  })
})

describe("authorizeCredentials: rate limiting", () => {
  it("throws LoginRateLimitedError when the email is locked, before any lookup or hashing", async () => {
    vi.mocked(checkRateLimit).mockImplementation(async (scope) =>
      scope === "login-email" ? { allowed: false, retryAfterSeconds: 600 } : { allowed: true }
    )
    await expect(authorizeCredentials(creds, ctx)).rejects.toMatchObject({
      name: "LoginRateLimitedError",
      retryAfterSeconds: 600,
    })
    expect(authPrismaMock.user.findUnique).not.toHaveBeenCalled()
    expect(verifyPasswordOrDummy).not.toHaveBeenCalled()
  })

  it("throws when the IP is locked even if the email is fresh", async () => {
    vi.mocked(checkRateLimit).mockImplementation(async (scope) =>
      scope === "login-ip" ? { allowed: false, retryAfterSeconds: 60 } : { allowed: true }
    )
    await expect(authorizeCredentials(creds, ctx)).rejects.toBeInstanceOf(LoginRateLimitedError)
    expect(verifyPasswordOrDummy).not.toHaveBeenCalled()
  })

  it("applies the same lock to an email that does not exist (no enumeration through the lock)", async () => {
    authPrismaMock.user.findUnique.mockResolvedValue(null)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 30 })
    await expect(authorizeCredentials(creds, ctx)).rejects.toBeInstanceOf(LoginRateLimitedError)
  })

  it("checks the limiter with the email and ip identifiers", async () => {
    await authorizeCredentials(creds, ctx)
    expect(checkRateLimit).toHaveBeenCalledWith("login-email", "ana@example.com", expect.any(Object))
    expect(checkRateLimit).toHaveBeenCalledWith("login-ip", "203.0.113.7", expect.any(Object))
  })
})
