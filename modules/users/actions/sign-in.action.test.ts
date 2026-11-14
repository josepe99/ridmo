import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../auth", () => ({ signIn: vi.fn() }))

import { signIn } from "../auth"
import { googleSignInAction, signInAction } from "./sign-in.action"

const signInMock = vi.mocked(signIn as unknown as (...args: unknown[]) => Promise<string>)
const valid = { email: "Ana@Example.com", password: "secret-123" }

beforeEach(() => {
  signInMock.mockReset().mockResolvedValue("http://localhost:3000/")
})

describe("signInAction", () => {
  it("signs in with credentials without letting Auth.js redirect, and returns the sanitized target", async () => {
    const result = await signInAction(valid, "/cart")

    expect(result).toEqual({ ok: true, redirectTo: "/cart" })
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "ana@example.com",
      password: "secret-123",
      redirect: false,
      redirectTo: "/cart",
    })
  })

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", undefined, 42])(
    "never redirects to the unsafe callbackUrl %j",
    async (callbackUrl) => {
      const result = await signInAction(valid, callbackUrl)
      expect(result).toEqual({ ok: true, redirectTo: "/" })
      expect(signInMock.mock.calls[0][1]).toMatchObject({ redirectTo: "/" })
    }
  )

  it("answers invalid input with the generic message without calling Auth.js", async () => {
    const result = await signInAction({ email: "bad", password: "" }, "/")
    expect(result).toMatchObject({ ok: false, code: "INVALID_CREDENTIALS" })
    expect(signInMock).not.toHaveBeenCalled()
  })

  it.each([
    "http://localhost:3000/sign-in?error=CredentialsSignin&code=credentials",
    "/sign-in?error=CredentialsSignin",
    "/sign-in?error=Configuration",
  ])("maps the failure url %s to one generic message", async (url) => {
    signInMock.mockResolvedValue(url)
    const result = await signInAction(valid, "/")
    expect(result).toMatchObject({ ok: false, code: "INVALID_CREDENTIALS", message: "Correo o contraseña incorrectos." })
  })

  it("tells a rate limited user to wait", async () => {
    signInMock.mockResolvedValue("/sign-in?error=CredentialsSignin&code=too_many_attempts")
    const result = await signInAction(valid, "/")
    expect(result).toMatchObject({ ok: false, code: "RATE_LIMITED" })
    expect((result as { message: string }).message).toMatch(/demasiados intentos/i)
  })

  it("recognises the lockout when Auth.js throws a CredentialsSignin carrying the code", async () => {
    signInMock.mockRejectedValue(Object.assign(new Error("CredentialsSignin"), { code: "too_many_attempts" }))
    await expect(signInAction(valid, "/")).resolves.toMatchObject({ ok: false, code: "RATE_LIMITED" })
  })

  it("maps a thrown credentials failure to the generic message", async () => {
    signInMock.mockRejectedValue(Object.assign(new Error("CredentialsSignin"), { code: "credentials" }))
    await expect(signInAction(valid, "/")).resolves.toMatchObject({ ok: false, code: "INVALID_CREDENTIALS" })
  })

  it("turns an exception from Auth.js into the generic failure, hiding the details", async () => {
    signInMock.mockRejectedValue(new Error("connect ECONNREFUSED mongodb://user:secret@db"))
    const result = await signInAction(valid, "/")
    expect(result).toMatchObject({ ok: false, code: "INVALID_CREDENTIALS" })
    expect(JSON.stringify(result)).not.toMatch(/ECONNREFUSED|secret/)
  })
})

describe("googleSignInAction", () => {
  it("starts the Google flow with a sanitized redirect", async () => {
    signInMock.mockResolvedValue("")
    await googleSignInAction("//evil.com")
    expect(signInMock).toHaveBeenCalledWith("google", { redirectTo: "/" })
  })

  it("keeps a safe callbackUrl", async () => {
    signInMock.mockResolvedValue("")
    await googleSignInAction("/cart")
    expect(signInMock).toHaveBeenCalledWith("google", { redirectTo: "/cart" })
  })
})
