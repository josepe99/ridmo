import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("../actions/sign-in.action", () => ({
  signInAction: vi.fn(),
  googleSignInAction: vi.fn(),
}))

import { signInAction } from "../actions/sign-in.action"
import { SignInForm } from "./sign-in-form"

const navigate = vi.fn()

function setup(props: Partial<React.ComponentProps<typeof SignInForm>> = {}) {
  const user = userEvent.setup({ delay: null })
  render(<SignInForm callbackUrl="/" googleEnabled={false} navigate={navigate} {...props} />)
  return user
}

const submitButton = () => screen.getByRole("button", { name: /Ingresar|Ingresando/ })

beforeEach(() => {
  navigate.mockReset()
  vi.mocked(signInAction).mockReset()
})

describe("SignInForm: validation", () => {
  it("renders labelled email and password fields", () => {
    setup()
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password")
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("autocomplete", "email")
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "current-password")
  })

  it("shows Spanish messages, aria-invalid and does not call the server for an empty submit", async () => {
    const user = setup()
    await user.click(submitButton())

    const email = screen.getByLabelText("Correo electrónico")
    const password = screen.getByLabelText("Contraseña")
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"))
    expect(password).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Ingresá tu correo electrónico")).toBeInTheDocument()
    expect(screen.getByText("Ingresá tu contraseña")).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription("Ingresá tu correo electrónico")
    expect(signInAction).not.toHaveBeenCalled()
  })

  it("rejects a malformed email", async () => {
    const user = setup()
    await user.type(screen.getByLabelText("Correo electrónico"), "not-an-email")
    await user.type(screen.getByLabelText("Contraseña"), "whatever")
    await user.click(submitButton())
    expect(await screen.findByText("Ingresá un correo electrónico válido")).toBeInTheDocument()
    expect(signInAction).not.toHaveBeenCalled()
  })
})

describe("SignInForm: submit", () => {
  it("sends the credentials plus the callbackUrl and navigates to the returned safe url", async () => {
    vi.mocked(signInAction).mockResolvedValue({ ok: true, redirectTo: "/cart" })
    const user = setup({ callbackUrl: "/cart" })
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "secret-123")
    await user.click(submitButton())

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/cart"))
    expect(signInAction).toHaveBeenCalledWith({ email: "ana@example.com", password: "secret-123" }, "/cart")
  })

  it("disables the submit button while the request is pending and prevents double submit", async () => {
    let resolve!: (value: { ok: true; redirectTo: string }) => void
    vi.mocked(signInAction).mockReturnValue(new Promise((r) => (resolve = r)))
    const user = setup()
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "secret-123")
    await user.click(submitButton())

    const pending = await screen.findByRole("button", { name: "Ingresando..." })
    expect(pending).toBeDisabled()
    await user.click(pending)
    expect(signInAction).toHaveBeenCalledTimes(1)

    resolve({ ok: true, redirectTo: "/" })
    await waitFor(() => expect(navigate).toHaveBeenCalled())
  })

  it("shows the generic server error in an alert and keeps the user on the page", async () => {
    vi.mocked(signInAction).mockResolvedValue({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Correo o contraseña incorrectos.",
    })
    const user = setup()
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "wrong-password")
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.")
    expect(navigate).not.toHaveBeenCalled()
    expect(submitButton()).toBeEnabled()
  })

  it("survives a rejected server action with a generic message", async () => {
    vi.mocked(signInAction).mockRejectedValue(new Error("boom"))
    const user = setup()
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "secret-123")
    await user.click(submitButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos iniciar sesión/)
  })
})

describe("SignInForm: Google and navigation", () => {
  it("hides the Google button when Google is not configured", () => {
    setup({ googleEnabled: false })
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument()
  })

  it("shows the Google button when it is configured", () => {
    setup({ googleEnabled: true })
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeInTheDocument()
  })

  it("explains an OAuthAccountNotLinked redirect in Spanish", () => {
    setup({ errorCode: "OAuthAccountNotLinked" })
    expect(screen.getByRole("alert")).toHaveTextContent(/ya existe una cuenta/i)
  })

  it("links to sign-up, keeping the callbackUrl", () => {
    setup({ callbackUrl: "/cart" })
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute(
      "href",
      "/sign-up?callbackUrl=%2Fcart"
    )
  })

  it("does not carry the callbackUrl in the link when it is the default", () => {
    setup()
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/sign-up")
  })
})
