import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

vi.mock("@/modules/users", () => ({ UserMenu: () => null }))

import MainNav from "./main-nav"

const collections = [
  { id: "c2", name: "Nueva", slug: "nueva" },
  { id: "c1", name: "Vieja", slug: "vieja" },
]

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /menu/i }))
  return screen.getByRole("dialog")
}

describe("MainNav menu", () => {
  it("lists the collections in the given order as working links", () => {
    render(<MainNav collections={collections} />)

    const dialog = openMenu()
    const links = within(dialog).getAllByRole("link")

    expect(links.map((link) => link.textContent)).toEqual(["Nueva", "Vieja"])
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/nueva", "/vieja"])
  })

  it("closes the menu when a collection link is clicked", () => {
    render(<MainNav collections={collections} />)

    const dialog = openMenu()
    fireEvent.click(within(dialog).getByRole("link", { name: "Nueva" }))

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("shows an empty state when there are no collections", () => {
    render(<MainNav collections={[]} />)

    const dialog = openMenu()

    expect(within(dialog).queryAllByRole("link")).toHaveLength(0)
    expect(within(dialog).getByText(/no hay colecciones/i)).toBeTruthy()
  })
})
