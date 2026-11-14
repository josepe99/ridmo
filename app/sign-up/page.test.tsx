import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn(async () => null) }))
vi.mock("@/modules/users/actions/register.action", () => ({ registerAction: vi.fn() }))
vi.mock("@/modules/users/actions/sign-in.action", () => ({ signInAction: vi.fn(), googleSignInAction: vi.fn() }))

import { resetNavigationMock } from "@/tests/mocks/next-navigation"
import { getCurrentUser } from "@/modules/users/server"
import SignUpPage, { metadata } from "./page"

const renderPage = async (params: Record<string, string | string[]> = {}) =>
  render(await SignUpPage({ searchParams: Promise.resolve(params) }))

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(getCurrentUser).mockReset().mockResolvedValue(null)
  vi.stubEnv("AUTH_GOOGLE_ID", "")
  vi.stubEnv("AUTH_GOOGLE_SECRET", "")
})

describe("sign-up page", () => {
  it("renders the form without any role field and is not indexed", async () => {
    await renderPage()
    expect(screen.getByRole("heading", { level: 1, name: "Crear cuenta" })).toBeInTheDocument()
    expect(document.querySelector('[name="role"]')).toBeNull()
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("hides Google when it is not configured", async () => {
    await renderPage()
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument()
  })

  it("links back to sign-in with the sanitized callbackUrl", async () => {
    await renderPage({ callbackUrl: "/\\evil.com" })
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/sign-in")
  })

  it("redirects a signed-in user away", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", name: null, email: "a@b.co", image: null, role: "USER" })
    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/")
  })
})
