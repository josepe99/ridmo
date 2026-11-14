import type { ComponentProps } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import type { CartItem } from "@/modules/cart"
import { CartItemsStep } from "./cart-items-step"

const ID = "665f1c2e8b3a4d0012a1b001"

const line = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: ID,
  name: "Cadena Milan",
  price: 3_900_000,
  image: "https://res.cloudinary.com/a.jpg",
  slug: "cadena-milan",
  quantity: 2,
  addedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

function setup(props: Partial<ComponentProps<typeof CartItemsStep>> = {}) {
  const handlers = {
    onQuantityChange: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
    onContinue: vi.fn(),
  }
  const view = render(<CartItemsStep items={[line()]} subtotal={7_800_000} {...handlers} {...props} />)
  return { ...handlers, view, user: userEvent.setup() }
}

describe("CartItemsStep", () => {
  it("renders its own heading with the step position", () => {
    setup()

    expect(screen.getByRole("heading", { level: 2, name: "Tu selección" })).toBeInTheDocument()
    expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument()
  })

  it("lists each line with unit price, line total and quantity in guaranies", () => {
    setup()

    const items = screen.getByRole("list", { name: "Productos en tu carrito" })
    expect(within(items).getByText("Cadena Milan")).toBeInTheDocument()
    expect(within(items).getByText("Gs. 3.900.000")).toBeInTheDocument()
    expect(within(items).getByText("Gs. 7.800.000")).toBeInTheDocument()
    expect(within(items).getByText("2")).toBeInTheDocument()
  })

  it("shows the subtotal", () => {
    setup()

    expect(screen.getByText("Subtotal").parentElement).toHaveTextContent("Gs. 7.800.000")
  })

  it("renders the product image inside a fixed 3:4 frame", () => {
    const { view } = setup()

    expect(view.container.querySelector("img")?.parentElement).toHaveClass("aspect-[3/4]")
  })

  it("reports quantity changes for the plus and minus buttons", async () => {
    const { user, onQuantityChange } = setup()

    await user.click(screen.getByRole("button", { name: "Agregar una unidad de Cadena Milan" }))
    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Cadena Milan" }))

    expect(onQuantityChange).toHaveBeenNthCalledWith(1, ID, 3)
    expect(onQuantityChange).toHaveBeenNthCalledWith(2, ID, 1)
  })

  it("disables the add button at the 20 unit limit", () => {
    setup({ items: [line({ quantity: 20 })] })

    expect(screen.getByRole("button", { name: "Agregar una unidad de Cadena Milan" })).toBeDisabled()
  })

  it("removes a line and clears the cart", async () => {
    const { user, onRemove, onClear } = setup()

    await user.click(screen.getByRole("button", { name: "Quitar Cadena Milan del carrito" }))
    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }))

    expect(onRemove).toHaveBeenCalledWith(ID)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it("links back to the store", () => {
    setup()

    expect(screen.getByRole("link", { name: "Seguir comprando" })).toHaveAttribute("href", "/")
  })

  it("continues with the primary button", async () => {
    const { user, onContinue } = setup()

    await user.click(screen.getByRole("button", { name: "Continuar" }))

    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it("does not offer a Volver button on the first step", () => {
    setup()

    expect(screen.queryByRole("button", { name: "Volver" })).not.toBeInTheDocument()
  })

  it("announces a line error under the affected product", () => {
    setup({ lineErrors: { [ID]: "Solo quedan 1 unidades de uno de tus productos." } })

    expect(screen.getByRole("alert")).toHaveTextContent("Solo quedan 1 unidades")
  })

  it("announces a step level message", () => {
    setup({ message: "Uno de tus productos se agotó." })

    expect(screen.getByRole("alert")).toHaveTextContent("Uno de tus productos se agotó.")
  })

  it("renders the compact summary slot above the button", () => {
    setup({ summary: <p>resumen compacto</p> })

    expect(screen.getByText("resumen compacto")).toBeInTheDocument()
  })
})
