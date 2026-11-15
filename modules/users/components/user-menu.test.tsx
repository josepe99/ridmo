import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("next-auth/react", () => ({ useSession: vi.fn(), signOut: vi.fn() }))

import { signOut, useSession } from "next-auth/react"
import { UserMenu } from "./user-menu"

const sessionOf = (user: Record<string, unknown> | null, status = user ? "authenticated" : "unauthenticated") =>
  vi.mocked(useSession).mockReturnValue({ data: user ? { user, expires: "2099" } : null, status, update: vi.fn() } as never)

const openMenu = async () => {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Mi cuenta" }))
  return user
}

beforeEach(() => {
  vi.mocked(useSession).mockReset()
  vi.mocked(signOut).mockReset()
})

describe("UserMenu", () => {
  it("offers sign-in to guests", () => {
    sessionOf(null)
    render(<UserMenu />)
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/sign-in")
    expect(screen.queryByRole("button", { name: "Mi cuenta" })).not.toBeInTheDocument()
  })

  it("renders nothing interactive while the session loads", () => {
    sessionOf(null, "loading")
    render(<UserMenu />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("keeps the account actions hidden until the avatar is pressed", () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "USER" })
    render(<UserMenu />)
    expect(screen.getByRole("button", { name: "Mi cuenta" })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("shows who is signed in and the profile link to a customer, without the admin link", async () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "USER" })
    render(<UserMenu />)
    await openMenu()

    expect(screen.getByRole("menu")).toHaveTextContent("Ana")
    expect(screen.getByRole("menu")).toHaveTextContent("a@b.co")
    expect(screen.getByRole("menuitem", { name: "Mi perfil" })).toHaveAttribute("href", "/profile")
    expect(screen.queryByRole("menuitem", { name: "Panel de administración" })).not.toBeInTheDocument()
  })

  it("shows the admin link when the token says ADMIN", async () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "ADMIN" })
    render(<UserMenu />)
    await openMenu()

    expect(screen.getByRole("menuitem", { name: "Panel de administración" })).toHaveAttribute("href", "/admin")
  })

  it("signs the user out from the menu", async () => {
    sessionOf({ id: "u1", name: "Ana", email: "a@b.co", role: "USER" })
    render(<UserMenu />)
    const user = await openMenu()

    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }))
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })
})
