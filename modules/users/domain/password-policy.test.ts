import { describe, expect, it } from "vitest"
import {
  COMMON_PASSWORDS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  checkPasswordPolicy,
} from "./password-policy"

describe("checkPasswordPolicy", () => {
  it("accepts a long, unusual passphrase", () => {
    expect(checkPasswordPolicy("tortuga-azul-bicicleta-77")).toEqual({ ok: true })
  })

  it("enforces the 10 character minimum", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10)
    expect(checkPasswordPolicy("x7q!".repeat(2) + "zk")).toEqual({ ok: true })
    expect(checkPasswordPolicy("Abc123!!z")).toEqual({ ok: false, reason: "too_short" })
  })

  it("enforces the 128 character maximum", () => {
    expect(PASSWORD_MAX_LENGTH).toBe(128)
    expect(checkPasswordPolicy("a1".repeat(64))).toEqual({ ok: true })
    expect(checkPasswordPolicy("a1".repeat(64) + "x")).toEqual({ ok: false, reason: "too_long" })
  })

  it("rejects a password equal to the email, ignoring case and surrounding spaces", () => {
    expect(checkPasswordPolicy("ana.perez@example.com", { email: "Ana.Perez@Example.com" })).toEqual({
      ok: false,
      reason: "equals_email",
    })
    expect(checkPasswordPolicy(" ana.perez@example.com ", { email: "ana.perez@example.com" })).toEqual({
      ok: false,
      reason: "equals_email",
    })
  })

  it.each(["password123", "PASSWORD123", "1234567890", "qwertyuiop", "Iloveyou123"])(
    "rejects the very common password %j (case-insensitive)",
    (password) => {
      expect(checkPasswordPolicy(password)).toEqual({ ok: false, reason: "too_common" })
    }
  )

  it("ships a non-trivial built-in list, all lowercase and long enough to matter", () => {
    expect(COMMON_PASSWORDS.size).toBeGreaterThanOrEqual(30)
    for (const entry of COMMON_PASSWORDS) {
      expect(entry).toBe(entry.toLowerCase())
      expect(entry.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH)
    }
  })

  it("rejects a password made of a single repeated character", () => {
    expect(checkPasswordPolicy(" ".repeat(12))).toEqual({ ok: false, reason: "too_common" })
    expect(checkPasswordPolicy("a".repeat(12))).toEqual({ ok: false, reason: "too_common" })
  })

  it("does not trim the password (spaces are legitimate characters)", () => {
    expect(checkPasswordPolicy("a b c d e f g")).toEqual({ ok: true })
  })
})
