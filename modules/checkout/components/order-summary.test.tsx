import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { OrderSummary } from "./order-summary"

describe("OrderSummary (full)", () => {
  it("shows the items count, subtotal and total in guaranies", () => {
    render(<OrderSummary totalQuantity={3} totalPrice={11_700_000} />)

    expect(screen.getByText("3 artículos")).toBeInTheDocument()
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.getAllByText("Gs. 11.700.000")).toHaveLength(3) // items line, subtotal and total
    expect(screen.getByText("Total")).toBeInTheDocument()
  })

  it("uses the singular for one unit", () => {
    render(<OrderSummary totalQuantity={1} totalPrice={3_900_000} />)

    expect(screen.getByText("1 artículo")).toBeInTheDocument()
  })

  it("states that shipping is arranged and that prices are in guaranies", () => {
    render(<OrderSummary totalQuantity={1} totalPrice={1} />)

    expect(screen.getByText("A coordinar")).toBeInTheDocument()
    expect(screen.getByText(/precios están en guaraníes/)).toBeInTheDocument()
  })
})

describe("OrderSummary (compact)", () => {
  it("shows the count and the total only", () => {
    render(<OrderSummary variant="compact" totalQuantity={2} totalPrice={7_800_000} />)

    expect(screen.getByText("2 artículos")).toBeInTheDocument()
    expect(screen.getByText("Total")).toBeInTheDocument()
    expect(screen.getByText("Gs. 7.800.000")).toBeInTheDocument()
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument()
  })
})
