import { describe, expect, it } from "vitest"
import { emailSchema, normalizeEmail } from "./email"

describe("normalizeEmail", () => {
  it.each([
    ["Ana@Example.COM", "ana@example.com"],
    ["  ana@example.com \n", "ana@example.com"],
    ["ANA+Shop@Example.com", "ana+shop@example.com"],
    // Full-width characters fold to their ASCII form (NFKC) so look-alikes collide.
    ["ａｎａ@example.com", "ana@example.com"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected)
  })

  it("is idempotent", () => {
    const once = normalizeEmail("  Ana@Example.com ")
    expect(normalizeEmail(once)).toBe(once)
  })
})

describe("emailSchema", () => {
  it("accepts and normalizes a valid address", () => {
    expect(emailSchema.parse("  Ana@Example.COM ")).toBe("ana@example.com")
  })

  it.each(["", "   ", "not-an-email", "a@b", "@example.com", "a b@example.com", `${"a".repeat(250)}@x.com`])(
    "rejects %j",
    (input) => {
      expect(emailSchema.safeParse(input).success).toBe(false)
    }
  )

  it("rejects non-strings", () => {
    expect(emailSchema.safeParse(undefined).success).toBe(false)
    expect(emailSchema.safeParse({ toString: () => "a@b.com" }).success).toBe(false)
  })
})
