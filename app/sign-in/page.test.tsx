import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn(async () => null) }))
vi.mock("@/modules/users/actions/sign-in.action", () => ({ signInAction: vi.fn(), googleSignInAction: vi.fn() }))

import { redirect, resetNavigationMock } from "@/tests/mocks/next-navigation"
import { getCurrentUser } from "@/modules/users/server"
import SignInPage, { metadata } from "./page"

// Server render smoke test: the async page is awaited by hand and its output rendered.
const renderPage = async (params: Record<string, string | string[]> = {}) =>
  render(await SignInPage({ searchParams: Promise.resolve(params) }))

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(getCurrentUser).mockReset().mockResolvedValue(null)
  vi.stubEnv("AUTH_GOOGLE_ID", "")
  vi.stubEnv("AUTH_GOOGLE_SECRET", "")
})

describe("sign-in page", () => {
  it("renders the heading and the form, and is not indexed", async () => {
    await renderPage()
    expect(screen.getByRole("heading", { level: 1, name: "Iniciar sesión" })).toBeInTheDocument()
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("hides the Google button without credentials and shows it with them", async () => {
    const { unmount } = await renderPage()
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument()
    unmount()

    vi.stubEnv("AUTH_GOOGLE_ID", "id")
    vi.stubEnv("AUTH_GOOGLE_SECRET", "secret")
    await renderPage()
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeInTheDocument()
  })

  it("keeps a safe callbackUrl and drops a malicious one", async () => {
    const { unmount } = await renderPage({ callbackUrl: "/cart" })
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/sign-up?callbackUrl=%2Fcart")
    unmount()

    await renderPage({ callbackUrl: "//evil.com" })
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/sign-up")
  })

  it("explains the OAuthAccountNotLinked error in Spanish", async () => {
    await renderPage({ error: "OAuthAccountNotLinked" })
    expect(screen.getByRole("alert")).toHaveTextContent(/ya existe una cuenta/i)
  })

  it("sends an already signed-in user to the (sanitized) destination", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", name: null, email: "a@b.co", image: null, role: "USER" })
    await expect(renderPage({ callbackUrl: "https://evil.com" })).rejects.toThrow("NEXT_REDIRECT:/")
    expect(redirect).toHaveBeenCalledWith("/")
  })

  it("still renders the form if the session lookup fails", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("db down"))
    await renderPage()
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
  })
})
