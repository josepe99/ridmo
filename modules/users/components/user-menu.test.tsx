import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("next-auth/react", () => ({ useSession: vi.fn(), signOut: vi.fn() }))

import { signOut, useSession } from "next-auth/react"
import { UserMenu } from "./user-menu"

const sessionOf = (user: Record<string, unknown> | null, status = user ? "authenticated" : "unauthenticated") =>
  vi.mocked(useSession).mockReturnValue({ data: user ? { user, expires: "2099" } : null, status, update: vi.fn() } as never)

beforeEach(() => {
  vi.mocked(useSession).mockReset()
  vi.mocked(signOut).mockReset()
})

describe("UserMenu", () => {
  it("offers sign-in to guests", () => {
    sessionOf(null)
    render(<UserMenu />)
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/sign-in")
    expect(screen.queryByRole("link", { name: "Mi cuenta" })).not.toBeInTheDocument()
  })

  it("renders nothing interactive while the session loads", () => {
    sessionOf(null, "loading")
    render(<UserMenu />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows the profile link and a sign-out button to a customer, without the admin link", async () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "USER" })
    render(<UserMenu />)
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/profile")
    expect(screen.queryByRole("link", { name: "Administración" })).not.toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole("button", { name: "Cerrar sesión" }))
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })

  it("shows the admin link when the token says ADMIN", () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "ADMIN" })
    render(<UserMenu />)
    expect(screen.getByRole("link", { name: "Administración" })).toHaveAttribute("href", "/admin")
  })
})
