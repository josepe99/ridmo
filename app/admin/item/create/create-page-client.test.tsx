import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock, routerMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { CreateItemPageClient } from "./create-page-client"

const collections = [
  { id: "c1", name: "Cadenas" },
  { id: "c2", name: "Relojes" },
]

beforeEach(() => {
  resetNavigationMock()
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ id: "i1", collectionId: "c2" }) }) as Response))
})

describe("CreateItemPageClient", () => {
  it("explains that a collection is needed first when there are none", async () => {
    render(<CreateItemPageClient collections={[]} />)

    expect(screen.getByText("Necesitás al menos una colección antes de crear productos.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Crear una colección/ })).toHaveAttribute(
      "href",
      "/admin/collections/create"
    )
    await userEvent.click(screen.getByRole("button", { name: "Volver al panel" }))
    expect(routerMock.push).toHaveBeenCalledWith("/admin")
  })

  it("shows the item form with the default collection selected", () => {
    render(<CreateItemPageClient collections={collections} defaultCollectionId="c2" />)

    expect(screen.getByRole("combobox")).toHaveTextContent("Relojes")
    expect(screen.getByRole("button", { name: "Crear producto" })).toBeInTheDocument()
  })

  it("goes to the collection of the created item after a successful create", async () => {
    const user = userEvent.setup({ delay: null })
    render(<CreateItemPageClient collections={collections} defaultCollectionId="c1" />)
    await user.type(screen.getByLabelText("Nombre"), "Cadena")
    await user.type(screen.getByLabelText("Precio"), "10")
    await user.type(screen.getByLabelText("Inventario"), "1")

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/admin/collections/c2"))
    expect(routerMock.refresh).toHaveBeenCalled()
  })

  it("falls back to the default collection, then to the admin home", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: "i1" }) } as Response)
    const user = userEvent.setup({ delay: null })
    render(<CreateItemPageClient collections={collections} defaultCollectionId="c1" />)
    await user.type(screen.getByLabelText("Nombre"), "Cadena")
    await user.type(screen.getByLabelText("Precio"), "10")
    await user.type(screen.getByLabelText("Inventario"), "1")

    await user.click(screen.getByRole("button", { name: "Crear producto" }))

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/admin/collections/c1"))
  })

  it("Cancel returns to the admin", async () => {
    render(<CreateItemPageClient collections={collections} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(routerMock.push).toHaveBeenCalledWith("/admin")
  })
})
