import { describe, expect, it } from "vitest"
import { loginInputSchema, registerInputSchema } from "./schemas"

const valid = { name: "Ana Perez", email: "Ana@Example.com", password: "tortuga-azul-bicicleta-77" }

describe("registerInputSchema", () => {
  it("normalizes the email and keeps the password untouched", () => {
    const parsed = registerInputSchema.parse(valid)
    expect(parsed).toEqual({ name: "Ana Perez", email: "ana@example.com", password: valid.password })
  })

  it("strips any client supplied role or privileged field", () => {
    const parsed = registerInputSchema.parse({ ...valid, role: "ADMIN", isAdmin: true, id: "x" })
    expect(parsed).not.toHaveProperty("role")
    expect(parsed).not.toHaveProperty("isAdmin")
    expect(parsed).not.toHaveProperty("id")
  })

  it("allows an empty name and trims a given one", () => {
    expect(registerInputSchema.parse({ ...valid, name: "" }).name).toBeUndefined()
    expect(registerInputSchema.parse({ ...valid, name: "  Ana  " }).name).toBe("Ana")
    expect(registerInputSchema.parse({ email: valid.email, password: valid.password }).name).toBeUndefined()
  })

  it("rejects a name longer than 80 characters", () => {
    expect(registerInputSchema.safeParse({ ...valid, name: "x".repeat(81) }).success).toBe(false)
  })

  it("reports Spanish messages on the right field", () => {
    const result = registerInputSchema.safeParse({ ...valid, password: "corta" })
    expect(result.success).toBe(false)
    if (result.success) return
    const issue = result.error.issues.find((i) => i.path[0] === "password")
    expect(issue?.message).toMatch(/al menos 10 caracteres/)
  })

  it.each([
    ["password123", /demasiado común/i],
    ["a".repeat(129), /128/],
  ])("rejects %j", (password, message) => {
    const result = registerInputSchema.safeParse({ ...valid, password })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((i) => i.path[0] === "password" && message.test(i.message))).toBe(true)
  })

  it("rejects a password equal to the email", () => {
    const result = registerInputSchema.safeParse({
      ...valid,
      email: "ana.perez@example.com",
      password: "ANA.PEREZ@example.com",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((i) => i.path[0] === "password" && /email/i.test(i.message))).toBe(true)
  })

  it("rejects an invalid email", () => {
    expect(registerInputSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false)
  })
})

describe("loginInputSchema", () => {
  it("normalizes the email and accepts any non-empty password up to 128 chars", () => {
    expect(loginInputSchema.parse({ email: " A@B.co ", password: "x" })).toEqual({ email: "a@b.co", password: "x" })
  })

  it("does not apply the registration policy (so the login form never leaks policy details)", () => {
    expect(loginInputSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true)
  })

  it.each([
    [{ email: "a@b.co", password: "" }],
    [{ email: "a@b.co", password: "a".repeat(129) }],
    [{ email: "bad", password: "x" }],
    [{ email: "a@b.co" }],
    [null],
    ["string"],
  ])("rejects %j", (input) => {
    expect(loginInputSchema.safeParse(input).success).toBe(false)
  })
})
