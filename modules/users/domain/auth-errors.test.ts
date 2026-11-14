import { describe, expect, it } from "vitest"
import { authErrorMessage, GENERIC_SIGN_IN_ERROR } from "./auth-errors"

describe("authErrorMessage", () => {
  it("explains the OAuthAccountNotLinked case in Spanish without confirming who owns the email", () => {
    const message = authErrorMessage("OAuthAccountNotLinked")
    expect(message).toMatch(/ya existe una cuenta/i)
    expect(message).toMatch(/correo y contraseña/i)
  })

  it("explains an unverified Google email", () => {
    expect(authErrorMessage("GoogleEmailNotVerified")).toMatch(/verific/i)
  })

  it("gives rate-limited users a retry hint", () => {
    expect(authErrorMessage("too_many_attempts")).toMatch(/demasiados intentos/i)
  })

  it("uses one generic message for every credential failure code", () => {
    for (const code of ["CredentialsSignin", "credentials", "invalid_credentials"]) {
      expect(authErrorMessage(code)).toBe(GENERIC_SIGN_IN_ERROR)
    }
  })

  it("falls back to the generic message for unknown or missing codes and never echoes input", () => {
    expect(authErrorMessage("<img src=x onerror=alert(1)>")).toBe(GENERIC_SIGN_IN_ERROR)
    expect(authErrorMessage(undefined)).toBe(GENERIC_SIGN_IN_ERROR)
    expect(authErrorMessage(null)).toBe(GENERIC_SIGN_IN_ERROR)
  })

  it("never mentions whether the email exists", () => {
    expect(GENERIC_SIGN_IN_ERROR).not.toMatch(/no existe|no está registrad|inexistente/i)
  })
})
