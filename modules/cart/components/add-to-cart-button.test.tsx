import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AddToCartButton from "./add-to-cart-button"

const product = { id: "i1", name: "Cadena", price: 1000, image: "a.jpg", slug: "cadena" }
const storedCart = () => JSON.parse(localStorage.getItem("cart") ?? "null")

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

describe("AddToCartButton", () => {
  it("renders the default Spanish label and accepts custom children", () => {
    const { rerender } = render(<AddToCartButton product={product} />)
    expect(screen.getByRole("button", { name: "AÑADIR AL CARRITO" })).toBeInTheDocument()

    rerender(<AddToCartButton product={product}>Add to Bag</AddToCartButton>)
    expect(screen.getByRole("button", { name: "Add to Bag" })).toBeInTheDocument()
  })

  it("adds a new product with quantity 1 and a timestamp", async () => {
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))

    expect(storedCart()).toEqual([
      expect.objectContaining({
        id: "i1",
        name: "Cadena",
        price: 1000,
        image: "a.jpg",
        slug: "cadena",
        quantity: 1,
        addedAt: expect.any(String),
      }),
    ])
  })

  it("increments the quantity when the product is already in the cart", async () => {
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))
    await userEvent.click(screen.getByRole("button"))

    const cart = storedCart()
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it("keeps other products already in the cart", async () => {
    localStorage.setItem("cart", JSON.stringify([{ id: "other", quantity: 4 }]))
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))

    expect(storedCart().map((line: { id: string }) => line.id)).toEqual(["other", "i1"])
  })

  it("starts a fresh cart when the stored value is corrupted", async () => {
    localStorage.setItem("cart", "{broken")
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))

    expect(storedCart()).toHaveLength(1)
  })

  it("starts a fresh cart when the stored value is not an array", async () => {
    localStorage.setItem("cart", JSON.stringify({ id: "i1" }))
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))

    expect(storedCart()).toHaveLength(1)
  })

  it("notifies listeners (the nav badge) with a cartUpdated event", async () => {
    const listener = vi.fn()
    window.addEventListener("cartUpdated", listener)
    render(<AddToCartButton product={product} />)

    await userEvent.click(screen.getByRole("button"))
    window.removeEventListener("cartUpdated", listener)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("does not trigger the click of a surrounding link", async () => {
    const outer = vi.fn()
    render(
      <div onClick={outer}>
        <AddToCartButton product={product} />
      </div>
    )

    await userEvent.click(screen.getByRole("button"))

    expect(outer).not.toHaveBeenCalled()
  })

  it("applies the requested variant and size styles", () => {
    render(<AddToCartButton product={product} variant="outline" size="lg" className="custom" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom")
    expect(button).toHaveClass("border")
    expect(button).toHaveClass("h-10")
  })
})
