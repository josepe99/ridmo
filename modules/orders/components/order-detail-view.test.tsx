import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("../actions/update-order-status.action", () => ({ updateOrderStatusAction: vi.fn() }))

import type { OrderDetail } from "../types"
import { OrderDetailView } from "./order-detail-view"

const order: OrderDetail = {
  id: "o1",
  orderNumber: "RID-000009",
  status: "PENDING_PAYMENT",
  paymentMethod: "TRANSFER",
  subtotal: 7_000_000,
  total: 7_000_000,
  currency: "PYG",
  customerName: "Ana Perez",
  itemCount: 2,
  customer: { fullName: "Ana Perez", phone: "+595981000000", email: "ana@example.com" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    notes: "Tocar timbre",
  },
  items: [
    {
      itemId: "i1",
      name: "Cadena Milan",
      slug: "cadena-milan",
      image: null,
      unitPrice: 3_500_000,
      quantity: 2,
      lineTotal: 7_000_000,
    },
  ],
  displayCountry: null,
  displayCurrency: null,
  createdAt: "2026-01-15T12:00:00.000Z",
  updatedAt: "2026-01-15T12:00:00.000Z",
}

describe("OrderDetailView", () => {
  it("shows the order number and status", () => {
    render(<OrderDetailView order={order} />)

    expect(screen.getByRole("heading", { level: 1, name: "RID-000009" })).toBeInTheDocument()
    expect(screen.getAllByText("Pendiente de pago").length).toBeGreaterThan(0)
  })

  it("renders contact links for phone and email", () => {
    render(<OrderDetailView order={order} />)

    expect(screen.getByRole("link", { name: "+595981000000" })).toHaveAttribute("href", "tel:+595981000000")
    expect(screen.getByRole("link", { name: "ana@example.com" })).toHaveAttribute(
      "href",
      "mailto:ana@example.com"
    )
  })

  it("omits the email link when the customer gave none", () => {
    render(<OrderDetailView order={{ ...order, customer: { ...order.customer, email: null } }} />)

    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument()
  })

  it("shows the full shipping address with notes only when present", () => {
    const { rerender } = render(<OrderDetailView order={order} />)
    const address = screen.getByText("Calle Palma 123").closest("address") as HTMLElement
    expect(within(address).getByText("Asuncion, Central")).toBeInTheDocument()
    expect(within(address).getByText("Notas: Tocar timbre")).toBeInTheDocument()

    rerender(<OrderDetailView order={{ ...order, shippingAddress: { ...order.shippingAddress, notes: null } }} />)
    expect(screen.queryByText(/Notas:/)).not.toBeInTheDocument()
  })

  it("lists products with quantity x unit price and the total", () => {
    render(<OrderDetailView order={order} />)

    expect(screen.getByText("Cadena Milan")).toBeInTheDocument()
    expect(screen.getByText("2 × Gs. 3.500.000")).toBeInTheDocument()
    expect(screen.getAllByText("Gs. 7.000.000").length).toBeGreaterThanOrEqual(2)
  })

  it("offers the status actions allowed for the current status", () => {
    render(<OrderDetailView order={order} />)

    expect(screen.getByRole("button", { name: "Confirmar pago" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar pedido" })).toBeInTheDocument()
  })

  it("explains the display currency stored on legacy orders where the shopper saw converted prices", () => {
    render(<OrderDetailView order={{ ...order, displayCountry: "AR", displayCurrency: "ARS" }} />)

    expect(screen.getByText(/El cliente veía precios en ARS \(AR\)/)).toBeInTheDocument()
  })

  it("does not mention a display currency that equals the order currency", () => {
    render(<OrderDetailView order={{ ...order, displayCountry: "PY", displayCurrency: order.currency }} />)

    expect(screen.queryByText(/El cliente veía precios/)).not.toBeInTheDocument()
  })

  it("does not mention display currency otherwise", () => {
    render(<OrderDetailView order={order} />)

    expect(screen.queryByText(/El cliente veía precios/)).not.toBeInTheDocument()
  })
})
