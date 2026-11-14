import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "../domain/status"
import { OrderStatusBadge } from "./order-status-badge"

describe("OrderStatusBadge", () => {
  it.each(ORDER_STATUSES)("shows the Spanish label for %s", (status) => {
    render(<OrderStatusBadge status={status} />)

    expect(screen.getByText(ORDER_STATUS_LABELS[status])).toBeInTheDocument()
  })

  it("strikes through cancelled orders", () => {
    render(<OrderStatusBadge status="CANCELLED" />)

    expect(screen.getByText("Cancelado")).toHaveClass("line-through")
  })

  it("renders delivered orders as the solid (final) state", () => {
    render(<OrderStatusBadge status="DELIVERED" />)

    expect(screen.getByText("Entregado")).toHaveClass("bg-black", "text-white")
  })

  it("merges extra classes", () => {
    render(<OrderStatusBadge status="SHIPPED" className="self-start" />)

    expect(screen.getByText("Enviado")).toHaveClass("self-start")
  })
})
