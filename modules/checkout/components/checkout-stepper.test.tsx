import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CheckoutStepper } from "./checkout-stepper"

describe("CheckoutStepper", () => {
  it("renders the three labeled steps in an ordered list", () => {
    render(<CheckoutStepper current="items" onSelect={vi.fn()} />)

    const list = screen.getByRole("list")
    expect(list.tagName).toBe("OL")
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent("Productos")
    expect(items[1]).toHaveTextContent("Datos de envío")
    expect(items[2]).toHaveTextContent("Datos de pago")
  })

  it("is a labeled navigation landmark", () => {
    render(<CheckoutStepper current="items" onSelect={vi.fn()} />)

    expect(screen.getByRole("navigation", { name: "Pasos del pedido" })).toBeInTheDocument()
  })

  it.each([
    ["items", 0],
    ["shipping", 1],
    ["payment", 2],
  ] as const)("marks only the %s step as the current one", (current, index) => {
    render(<CheckoutStepper current={current} onSelect={vi.fn()} />)

    const items = screen.getAllByRole("listitem")
    items.forEach((item, position) => {
      if (position === index) expect(item).toHaveAttribute("aria-current", "step")
      else expect(item).not.toHaveAttribute("aria-current")
    })
  })

  it("has no clickable step on the first step", () => {
    render(<CheckoutStepper current="items" onSelect={vi.fn()} />)

    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("makes completed steps buttons that report the chosen step", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<CheckoutStepper current="payment" onSelect={onSelect} />)

    expect(screen.getAllByRole("button")).toHaveLength(2)
    await user.click(screen.getByRole("button", { name: /Productos/ }))
    await user.click(screen.getByRole("button", { name: /Datos de envío/ }))

    expect(onSelect).toHaveBeenNthCalledWith(1, "items")
    expect(onSelect).toHaveBeenNthCalledWith(2, "shipping")
  })

  it("does not make the current or future steps clickable", () => {
    render(<CheckoutStepper current="shipping" onSelect={vi.fn()} />)

    expect(screen.queryByRole("button", { name: /Datos de envío/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Datos de pago/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Productos/ })).toBeInTheDocument()
  })

  it("conveys completion with text, not only color", () => {
    render(<CheckoutStepper current="payment" onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Productos\s*\(completado/ })).toBeInTheDocument()
  })
})
