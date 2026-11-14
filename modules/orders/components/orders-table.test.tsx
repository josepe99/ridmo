import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import type { OrderSummary } from "../types"
import { OrdersTable } from "./orders-table"

const order = (overrides: Partial<OrderSummary> = {}): OrderSummary => ({
  id: "o1",
  orderNumber: "RID-000001",
  status: "PENDING_PAYMENT",
  total: 6_800_000,
  currency: "PYG",
  customerName: "Ana Perez",
  itemCount: 2,
  createdAt: "2026-01-15T12:00:00.000Z",
  ...overrides,
})

describe("OrdersTable", () => {
  it("shows an empty state when there are no orders", () => {
    render(<OrdersTable orders={[]} />)

    expect(screen.getByText("Todavía no hay pedidos")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders one row per order with number, customer, status and total", () => {
    render(<OrdersTable orders={[order(), order({ id: "o2", orderNumber: "RID-000002", customerName: "Luis" })]} />)

    const rows = screen.getAllByRole("row")
    expect(rows).toHaveLength(3) // header + 2
    const first = within(rows[1])
    expect(first.getByRole("link", { name: "RID-000001" })).toHaveAttribute("href", "/admin/orders/o1")
    expect(first.getByText("Ana Perez")).toBeInTheDocument()
    expect(first.getByText("Pendiente de pago")).toBeInTheDocument()
    expect(first.getByText("Gs. 6.800.000")).toBeInTheDocument()
  })

  it("pluralises the unit count", () => {
    render(<OrdersTable orders={[order({ itemCount: 1 }), order({ id: "o2", itemCount: 3 })]} />)

    expect(screen.getByText("1 unidad")).toBeInTheDocument()
    expect(screen.getByText("3 unidades")).toBeInTheDocument()
  })

  it("has an accessible caption and column headers", () => {
    render(<OrdersTable orders={[order()]} />)

    expect(screen.getByRole("table", { name: /Pedidos, del más reciente al más antiguo/ })).toBeInTheDocument()
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Pedido",
      "Cliente",
      "Fecha",
      "Estado",
      "Total",
    ])
  })
})
