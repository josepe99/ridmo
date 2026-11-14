import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)
vi.mock("./password-hasher", () => ({
  hashPassword: vi.fn(async () => "$argon2id$v=19$m=19456,t=2,p=1$mock$hash"),
}))
vi.mock("./rate-limiter", () => ({
  checkRateLimit: vi.fn(),
  recordRateLimitHit: vi.fn(),
}))

import { hashPassword } from "./password-hasher"
import { checkRateLimit, recordRateLimitHit } from "./rate-limiter"
import { registerUser } from "./register-user"

const valid = { name: "Ana Perez", email: "Ana@Example.com", password: "tortuga-azul-bicicleta-77" }
const ctx = { ip: "203.0.113.7" }

beforeEach(() => {
  resetAuthPrismaMock()
  vi.mocked(hashPassword).mockClear()
  vi.mocked(checkRateLimit).mockReset().mockResolvedValue({ allowed: true })
  vi.mocked(recordRateLimitHit).mockReset().mockResolvedValue(undefined)
  authPrismaMock.user.create.mockResolvedValue({ id: "u1", name: "Ana Perez", email: "ana@example.com" })
})

describe("registerUser", () => {
  it("creates a USER with a normalized email and a stored hash, never the plaintext", async () => {
    const result = await registerUser(valid, ctx)

    expect(result).toEqual({ ok: true, user: { id: "u1", name: "Ana Perez", email: "ana@example.com" } })
    expect(authPrismaMock.user.create).toHaveBeenCalledTimes(1)
    const args = authPrismaMock.user.create.mock.calls[0][0]
    expect(args.data).toEqual({
      name: "Ana Perez",
      email: "ana@example.com",
      passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$mock$hash",
      role: "USER",
    })
    expect(JSON.stringify(args)).not.toContain(valid.password)
  })

  it.each([
    [{ role: "ADMIN" }],
    [{ role: "admin" }],
    [{ isAdmin: true }],
    [{ role: ["ADMIN"] }],
  ])("forces role USER even if the payload says %j", async (extra) => {
    await registerUser({ ...valid, ...extra }, ctx)
    expect(authPrismaMock.user.create.mock.calls[0][0].data.role).toBe("USER")
  })

  it("never returns the password hash or selects it from the database", async () => {
    authPrismaMock.user.create.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
      passwordHash: "leaky",
      role: "USER",
    })
    const result = await registerUser(valid, ctx)
    expect(JSON.stringify(result)).not.toMatch(/leaky|passwordHash|argon2/)
    expect(authPrismaMock.user.create.mock.calls[0][0].select).toEqual({ id: true, name: true, email: true })
  })

  it("returns field errors and touches nothing when validation fails", async () => {
    const result = await registerUser({ ...valid, password: "corta" }, ctx)
    expect(result).toMatchObject({ ok: false, code: "VALIDATION" })
    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors.password).toMatch(/10 caracteres/)
    expect(authPrismaMock.user.create).not.toHaveBeenCalled()
    expect(hashPassword).not.toHaveBeenCalled()
  })

  it("answers an existing email with the same generic failure, without saying the email exists", async () => {
    authPrismaMock.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" })
    )
    const result = await registerUser(valid, ctx)
    expect(result).toEqual({ ok: false, code: "REGISTRATION_FAILED" })
    expect(JSON.stringify(result)).not.toMatch(/exist|duplicate|registrad/i)
    // The hash was still computed, so the response time does not reveal the duplicate.
    expect(hashPassword).toHaveBeenCalledTimes(1)
  })

  it("rethrows unexpected database errors instead of pretending the signup worked", async () => {
    authPrismaMock.user.create.mockRejectedValue(new Error("db down"))
    await expect(registerUser(valid, ctx)).rejects.toThrow("db down")
  })

  it("is blocked, before any hashing or writing, when the IP is rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 120 })
    const result = await registerUser(valid, ctx)
    expect(result).toEqual({ ok: false, code: "RATE_LIMITED", retryAfterSeconds: 120 })
    expect(hashPassword).not.toHaveBeenCalled()
    expect(authPrismaMock.user.create).not.toHaveBeenCalled()
    expect(checkRateLimit).toHaveBeenCalledWith("register-ip", "203.0.113.7", expect.any(Object))
  })

  it("counts every attempt against the IP budget, valid or not", async () => {
    await registerUser(valid, ctx)
    await registerUser({ ...valid, password: "x" }, ctx)
    expect(recordRateLimitHit).toHaveBeenCalledTimes(2)
    expect(recordRateLimitHit).toHaveBeenCalledWith("register-ip", "203.0.113.7", expect.any(Object))
  })
})
