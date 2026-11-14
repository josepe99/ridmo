import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from "./password-hasher"

// These tests use the real argon2id binding on purpose: the wrapper is thin and the
// interesting properties (salting, format, failure modes) belong to the real thing.
describe("password hasher (argon2id)", () => {
  it("produces an argon2id PHC string that does not contain the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(hash.startsWith("$argon2id$")).toBe(true)
    expect(hash).not.toContain("correct horse")
  })

  it("uses at least the OWASP minimum cost (19 MiB, 2 iterations)", async () => {
    const hash = await hashPassword("some-long-password")
    const match = /m=(\d+),t=(\d+),p=(\d+)/.exec(hash)
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(19456)
    expect(Number(match?.[2])).toBeGreaterThanOrEqual(2)
  })

  it("salts: hashing the same password twice gives different hashes that both verify", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-1"), hashPassword("same-password-1")])
    expect(a).not.toBe(b)
    expect(await verifyPassword(a, "same-password-1")).toBe(true)
    expect(await verifyPassword(b, "same-password-1")).toBe(true)
  })

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("right-password-123")
    expect(await verifyPassword(hash, "right-password-123")).toBe(true)
    expect(await verifyPassword(hash, "wrong-password-123")).toBe(false)
    expect(await verifyPassword(hash, "")).toBe(false)
  })

  it("treats a malformed or empty stored hash as a failed verification instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "whatever")).toBe(false)
    expect(await verifyPassword("", "whatever")).toBe(false)
  })

  it("refuses to hash an empty password", async () => {
    await expect(hashPassword("")).rejects.toThrow()
  })
})

describe("verifyPasswordOrDummy", () => {
  it("verifies against a real hash", async () => {
    const hash = await hashPassword("right-password-123")
    expect(await verifyPasswordOrDummy(hash, "right-password-123")).toBe(true)
    expect(await verifyPasswordOrDummy(hash, "nope-nope-nope")).toBe(false)
  })

  it.each([null, undefined, ""])("returns false for a missing hash (%j) after doing a dummy verification", async (hash) => {
    expect(await verifyPasswordOrDummy(hash, "anything-at-all")).toBe(false)
  })

  it("cannot be satisfied by guessing the dummy password", async () => {
    expect(await verifyPasswordOrDummy(null, "dummy-password-not-in-use")).toBe(false)
    expect(await verifyPasswordOrDummy(null, "")).toBe(false)
  })

  it("spends comparable time whether or not the account exists", async () => {
    const hash = await hashPassword("right-password-123")
    await verifyPasswordOrDummy(null, "warm-up") // initialise the dummy hash
    const time = async (stored: string | null) => {
      const start = performance.now()
      await verifyPasswordOrDummy(stored, "wrong-password-xyz")
      return performance.now() - start
    }
    const existing = await time(hash)
    const missing = await time(null)
    // Both run one full argon2 verification; allow generous slack for CI noise.
    expect(missing).toBeGreaterThan(existing / 4)
  })
})
