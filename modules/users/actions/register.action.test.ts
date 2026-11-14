import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
}))
vi.mock("../services/register-user", () => ({ registerUser: vi.fn() }))
vi.mock("../auth", () => ({ signIn: vi.fn() }))

import { signIn } from "../auth"
import { registerUser } from "../services/register-user"
import { registerAction } from "./register.action"

const signInMock = vi.mocked(signIn as unknown as (...args: unknown[]) => Promise<string>)
const input = { name: "Ana", email: "ana@example.com", password: "tortuga-azul-bicicleta-77", role: "ADMIN" }

beforeEach(() => {
  vi.mocked(registerUser).mockReset().mockResolvedValue({
    ok: true,
    user: { id: "u1", name: "Ana", email: "ana@example.com" },
  })
  signInMock.mockReset().mockResolvedValue("http://localhost:3000/")
})

describe("registerAction", () => {
  it("registers with the caller's IP, signs the new user in and returns the sanitized target", async () => {
    const result = await registerAction(input, "/cart")

    expect(registerUser).toHaveBeenCalledWith(input, { ip: "203.0.113.7" })
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "ana@example.com",
      password: "tortuga-azul-bicicleta-77",
      redirect: false,
      redirectTo: "/cart",
    })
    expect(result).toEqual({ ok: true, redirectTo: "/cart" })
  })

  it("does not trust the client for the role: the service, not the action, owns it", async () => {
    await registerAction(input, "/")
    // The raw payload is handed to the service which strips it; the action never builds a user itself.
    expect(vi.mocked(registerUser).mock.calls[0][0]).toBe(input)
  })

  it("sanitizes the callbackUrl", async () => {
    const result = await registerAction(input, "//evil.com")
    expect(result).toEqual({ ok: true, redirectTo: "/" })
  })

  it("falls back to the sign-in page when the automatic sign-in fails after registering", async () => {
    signInMock.mockResolvedValue("/sign-in?error=CredentialsSignin&code=credentials")
    const result = await registerAction(input, "/")
    expect(result).toEqual({ ok: true, redirectTo: "/sign-in" })
  })

  it("never signs in when the registration failed", async () => {
    vi.mocked(registerUser).mockResolvedValue({ ok: false, code: "REGISTRATION_FAILED" })
    const result = await registerAction(input, "/")
    expect(signInMock).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false, code: "REGISTRATION_FAILED" })
    expect((result as { message: string }).message).toMatch(/No pudimos crear la cuenta/)
  })

  it("passes field errors through", async () => {
    vi.mocked(registerUser).mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      fieldErrors: { password: "La contraseña es demasiado común" },
    })
    const result = await registerAction(input, "/")
    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION",
      fieldErrors: { password: "La contraseña es demasiado común" },
    })
  })

  it("reports rate limiting with a wait hint", async () => {
    vi.mocked(registerUser).mockResolvedValue({ ok: false, code: "RATE_LIMITED", retryAfterSeconds: 600 })
    const result = await registerAction(input, "/")
    expect(result).toMatchObject({ ok: false, code: "RATE_LIMITED" })
    expect((result as { message: string }).message).toMatch(/demasiados intentos/i)
  })

  it("hides unexpected failures behind a generic message", async () => {
    vi.mocked(registerUser).mockRejectedValue(new Error("mongodb://user:secret@db down"))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await registerAction(input, "/")
    expect(result).toMatchObject({ ok: false, code: "REGISTRATION_FAILED" })
    expect(JSON.stringify(result)).not.toMatch(/secret|mongodb/)
  })
})
