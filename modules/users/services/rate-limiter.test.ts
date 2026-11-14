import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)

import { checkRateLimit, rateLimitKey, recordRateLimitHit, resetRateLimit } from "./rate-limiter"
import type { LimitPolicy } from "../domain/rate-limit"

const MIN = 60_000
const policy: LimitPolicy = { maxAttempts: 3, windowMs: 15 * MIN, lockMs: 15 * MIN }
const now = new Date("2026-01-01T00:00:00.000Z")

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  key: "k",
  count: 1,
  windowStart: now,
  lockedUntil: null,
  ...overrides,
})

const model = () => authPrismaMock.loginAttempt

beforeEach(() => resetAuthPrismaMock())

describe("rateLimitKey", () => {
  it("is scoped, stable and never contains the raw identifier", () => {
    const key = rateLimitKey("login-email", "ana@example.com")
    expect(key).toMatch(/^login-email:[0-9a-f]{64}$/)
    expect(key).not.toContain("ana")
    expect(rateLimitKey("login-email", "ana@example.com")).toBe(key)
    expect(rateLimitKey("login-ip", "ana@example.com")).not.toBe(key)
    expect(rateLimitKey("login-email", "bob@example.com")).not.toBe(key)
  })
})

describe("checkRateLimit", () => {
  it("allows when nothing is stored", async () => {
    model().findUnique.mockResolvedValue(null)
    await expect(checkRateLimit("login-email", "a@b.co", policy, now)).resolves.toEqual({ allowed: true })
    expect(model().findUnique).toHaveBeenCalledWith({ where: { key: rateLimitKey("login-email", "a@b.co") } })
  })

  it("denies while locked and reports the wait", async () => {
    model().findUnique.mockResolvedValue(row({ count: 3, lockedUntil: new Date(now.getTime() + 5 * MIN) }))
    await expect(checkRateLimit("login-email", "a@b.co", policy, now)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 300,
    })
  })

  it("allows once the lock expired", async () => {
    model().findUnique.mockResolvedValue(row({ count: 3, lockedUntil: new Date(now.getTime() - 1) }))
    await expect(checkRateLimit("login-email", "a@b.co", policy, now)).resolves.toEqual({ allowed: true })
  })
})

describe("recordRateLimitHit", () => {
  it("creates the counter on the first hit", async () => {
    model().findUnique.mockResolvedValue(null)
    model().create.mockResolvedValue(row())
    await recordRateLimitHit("login-email", "a@b.co", policy, now)
    expect(model().create).toHaveBeenCalledWith({
      data: { key: rateLimitKey("login-email", "a@b.co"), count: 1, windowStart: now, lockedUntil: null },
    })
  })

  it("updates with compare-and-swap on the previously read state", async () => {
    const previous = row({ count: 1 })
    model().findUnique.mockResolvedValue(previous)
    model().updateMany.mockResolvedValue({ count: 1 })
    await recordRateLimitHit("login-email", "a@b.co", policy, new Date(now.getTime() + 1000))
    expect(model().updateMany).toHaveBeenCalledWith({
      where: { key: rateLimitKey("login-email", "a@b.co"), count: 1, windowStart: now },
      data: { count: 2, windowStart: now, lockedUntil: null },
    })
  })

  it("locks when the threshold is reached", async () => {
    model().findUnique.mockResolvedValue(row({ count: 2 }))
    model().updateMany.mockResolvedValue({ count: 1 })
    const later = new Date(now.getTime() + 1000)
    await recordRateLimitHit("login-email", "a@b.co", policy, later)
    expect(model().updateMany.mock.calls[0][0].data).toEqual({
      count: 3,
      windowStart: now,
      lockedUntil: new Date(later.getTime() + policy.lockMs),
    })
  })

  it("re-reads and retries when a concurrent request changed the row (lost update protection)", async () => {
    model().findUnique
      .mockResolvedValueOnce(row({ count: 1 }))
      .mockResolvedValueOnce(row({ count: 2 }))
    model().updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 })
    await recordRateLimitHit("login-email", "a@b.co", policy, new Date(now.getTime() + 1000))
    expect(model().updateMany).toHaveBeenCalledTimes(2)
    expect(model().updateMany.mock.calls[1][0].where).toMatchObject({ count: 2 })
    expect(model().updateMany.mock.calls[1][0].data.count).toBe(3)
  })

  it("recovers when two requests race to create the first row", async () => {
    const unique = new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" })
    model().findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(row({ count: 1 }))
    model().create.mockRejectedValueOnce(unique)
    model().updateMany.mockResolvedValue({ count: 1 })
    await recordRateLimitHit("login-email", "a@b.co", policy, new Date(now.getTime() + 1000))
    expect(model().updateMany.mock.calls[0][0].data.count).toBe(2)
  })

  it("gives up quietly after the retry budget rather than blocking the request", async () => {
    model().findUnique.mockResolvedValue(row({ count: 1 }))
    model().updateMany.mockResolvedValue({ count: 0 })
    await expect(recordRateLimitHit("login-email", "a@b.co", policy, now)).resolves.toBeUndefined()
    expect(model().updateMany.mock.calls.length).toBeLessThanOrEqual(5)
  })

  it("propagates unexpected database failures (fail closed)", async () => {
    model().findUnique.mockRejectedValue(new Error("db down"))
    await expect(recordRateLimitHit("login-email", "a@b.co", policy, now)).rejects.toThrow("db down")
  })
})

describe("resetRateLimit", () => {
  it("deletes the counter for the key", async () => {
    model().deleteMany.mockResolvedValue({ count: 1 })
    await resetRateLimit("login-email", "a@b.co")
    expect(model().deleteMany).toHaveBeenCalledWith({ where: { key: rateLimitKey("login-email", "a@b.co") } })
  })
})
