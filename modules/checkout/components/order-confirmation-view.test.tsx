import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))

import type { OrderConfirmation } from "@/modules/orders"
import type { BankTransferDetails } from "../services/bank-details"
import { OrderConfirmationView } from "./order-confirmation-view"

const order: OrderConfirmation = {
  orderNumber: "RID-000042",
  status: "PENDING_PAYMENT",
  currency: "PYG",
  subtotal: 7_000_000,
  total: 7_000_000,
  customerName: "Ana Maria Perez",
  createdAt: "2026-01-15T12:00:00.000Z",
  items: [
    {
      itemId: "i1",
      name: "Cadena Milan",
      slug: "cadena-milan",
      image: "https://res.cloudinary.com/a.jpg",
      unitPrice: 3_500_000,
      quantity: 2,
      lineTotal: 7_000_000,
    },
  ],
}

const bank: BankTransferDetails = {
  bankName: "Banco Familiar",
  accountHolder: "RIDMO SA",
  accountNumber: "123-456",
  alias: "ridmo.pay",
  notes: "Enviar comprobante hoy",
}

const emptyBank: BankTransferDetails = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  alias: "",
  notes: "",
}

describe("OrderConfirmationView", () => {
  it("greets the customer by first name and shows the order number and status", () => {
    render(<OrderConfirmationView order={order} bank={bank} />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gracias, Ana")
    expect(screen.getAllByText("RID-000042").length).toBeGreaterThan(0)
    expect(screen.getByText("Pendiente de pago")).toBeInTheDocument()
  })

  it("tells the shopper the exact amount to transfer", () => {
    render(<OrderConfirmationView order={order} bank={bank} />)

    const transfer = screen.getByRole("region", { name: "Transferencia bancaria" })
    expect(within(transfer).getByText("Gs. 7.000.000")).toBeInTheDocument()
  })

  it("lists the bank details that are configured", () => {
    render(<OrderConfirmationView order={order} bank={bank} />)

    for (const value of ["Banco Familiar", "RIDMO SA", "123-456", "ridmo.pay", "Enviar comprobante hoy"]) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it("skips empty bank rows", () => {
    render(<OrderConfirmationView order={order} bank={{ ...emptyBank, bankName: "Banco Familiar" }} />)

    expect(screen.getByText("Banco")).toBeInTheDocument()
    expect(screen.queryByText("Titular")).not.toBeInTheDocument()
    expect(screen.queryByText("Cuenta")).not.toBeInTheDocument()
  })

  it("falls back to a message when no bank details are configured", () => {
    render(<OrderConfirmationView order={order} bank={emptyBank} />)

    expect(screen.getByText(/Te enviaremos los datos bancarios/)).toBeInTheDocument()
    expect(screen.queryByText("Banco")).not.toBeInTheDocument()
  })

  it("summarises each line with quantity x unit price and the line total", () => {
    render(<OrderConfirmationView order={order} bank={bank} />)

    const summary = screen.getByRole("region", { name: "Resumen del pedido" })
    expect(within(summary).getByText("Cadena Milan")).toBeInTheDocument()
    expect(within(summary).getByText("2 × Gs. 3.500.000")).toBeInTheDocument()
    expect(within(summary).getAllByText("Gs. 7.000.000").length).toBeGreaterThanOrEqual(2)
    expect(within(summary).getByRole("img", { name: "Cadena Milan" })).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/a.jpg"
    )
  })

  it("uses a placeholder for lines without an image", () => {
    render(
      <OrderConfirmationView
        order={{ ...order, items: [{ ...order.items[0], image: null }] }}
        bank={bank}
      />
    )

    expect(screen.getByRole("img", { name: "Cadena Milan" })).toHaveAttribute("src", "/placeholder.svg")
  })

  it("builds a WhatsApp proof link from the digits of the business number", () => {
    render(<OrderConfirmationView order={order} bank={bank} whatsappNumber="+595 981-123-456" />)

    const link = screen.getByRole("link", { name: "Enviar comprobante por WhatsApp" })
    const href = link.getAttribute("href") ?? ""
    expect(href.startsWith("https://wa.me/595981123456?text=")).toBe(true)
    expect(decodeURIComponent(href)).toContain("RID-000042")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it.each([undefined, "", "no digits here"])("hides the WhatsApp link for %j", (number) => {
    render(<OrderConfirmationView order={order} bank={bank} whatsappNumber={number} />)

    expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument()
  })

  it("links back to the store", () => {
    render(<OrderConfirmationView order={order} bank={bank} />)

    expect(screen.getByRole("link", { name: "Volver a la tienda" })).toHaveAttribute("href", "/")
  })
})
