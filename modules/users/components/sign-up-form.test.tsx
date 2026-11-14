import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("../actions/register.action", () => ({ registerAction: vi.fn() }))
vi.mock("../actions/sign-in.action", () => ({ signInAction: vi.fn(), googleSignInAction: vi.fn() }))

import { registerAction } from "../actions/register.action"
import { SignUpForm } from "./sign-up-form"

const navigate = vi.fn()

function setup(props: Partial<React.ComponentProps<typeof SignUpForm>> = {}) {
  const user = userEvent.setup({ delay: null })
  render(<SignUpForm callbackUrl="/" googleEnabled={false} navigate={navigate} {...props} />)
  return user
}

const submitButton = () => screen.getByRole("button", { name: /Crear cuenta|Creando/ })

async function fill(user: ReturnType<typeof userEvent.setup>, password = "tortuga-azul-bicicleta-77") {
  await user.type(screen.getByLabelText(/Nombre/), "Ana Perez")
  await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com")
  await user.type(screen.getByLabelText("Contraseña"), password)
}

beforeEach(() => {
  navigate.mockReset()
  vi.mocked(registerAction).mockReset()
})

describe("SignUpForm: validation", () => {
  it("labels every field and hints the password rule", () => {
    setup()
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument()
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "new-password")
    expect(screen.getByText(/Al menos 10 caracteres/)).toBeInTheDocument()
  })

  it("does not offer any role field", () => {
    setup()
    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument()
    expect(document.querySelector('[name="role"]')).toBeNull()
  })

  it("flags required fields with aria-invalid and Spanish messages, without calling the server", async () => {
    const user = setup()
    await user.click(submitButton())

    await waitFor(() => expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("aria-invalid", "true"))
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Ingresá tu correo electrónico")).toBeInTheDocument()
    expect(registerAction).not.toHaveBeenCalled()
  })

  it("enforces the password policy on the client too", async () => {
    const user = setup()
    await fill(user, "corta")
    await user.click(submitButton())
    expect(await screen.findByText(/al menos 10 caracteres/i, { selector: "p[role='alert']" })).toBeInTheDocument()
    expect(registerAction).not.toHaveBeenCalled()
  })

  it("rejects a very common password", async () => {
    const user = setup()
    await fill(user, "password123")
    await user.click(submitButton())
    expect(await screen.findByText(/demasiado común/i)).toBeInTheDocument()
  })
})

describe("SignUpForm: submit", () => {
  it("sends only name, email and password plus the callbackUrl, then navigates", async () => {
    vi.mocked(registerAction).mockResolvedValue({ ok: true, redirectTo: "/cart" })
    const user = setup({ callbackUrl: "/cart" })
    await fill(user)
    await user.click(submitButton())

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/cart"))
    expect(registerAction).toHaveBeenCalledWith(
      { name: "Ana Perez", email: "ana@example.com", password: "tortuga-azul-bicicleta-77" },
      "/cart"
    )
  })

  it("disables the button while pending", async () => {
    let resolve!: (value: { ok: true; redirectTo: string }) => void
    vi.mocked(registerAction).mockReturnValue(new Promise((r) => (resolve = r)))
    const user = setup()
    await fill(user)
    await user.click(submitButton())

    expect(await screen.findByRole("button", { name: "Creando cuenta..." })).toBeDisabled()
    resolve({ ok: true, redirectTo: "/" })
    await waitFor(() => expect(navigate).toHaveBeenCalled())
  })

  it("shows server side field errors next to the field", async () => {
    vi.mocked(registerAction).mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors: { password: "La contraseña es demasiado común" },
    })
    const user = setup()
    await fill(user)
    await user.click(submitButton())
    expect(await screen.findByText("La contraseña es demasiado común")).toBeInTheDocument()
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("aria-invalid", "true")
  })

  it("shows the generic registration failure without revealing whether the email exists", async () => {
    vi.mocked(registerAction).mockResolvedValue({
      ok: false,
      code: "REGISTRATION_FAILED",
      message: "No pudimos crear la cuenta con esos datos. Si ya tenés una, iniciá sesión.",
    })
    const user = setup()
    await fill(user)
    await user.click(submitButton())
    const alert = await screen.findByRole("alert", {}, { timeout: 2000 })
    expect(alert).toHaveTextContent(/No pudimos crear la cuenta/)
    expect(alert).not.toHaveTextContent(/ya está registrado|ya existe/i)
  })
})

describe("SignUpForm: Google and navigation", () => {
  it("hides the Google button when not configured and shows it when configured", () => {
    setup({ googleEnabled: false })
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument()
  })

  it("shows the Google button when configured", () => {
    setup({ googleEnabled: true })
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeInTheDocument()
  })

  it("links back to sign-in", () => {
    setup({ callbackUrl: "/cart" })
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/sign-in?callbackUrl=%2Fcart"
    )
  })
})
