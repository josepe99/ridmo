import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetNavigationMock } from "@/tests/mocks/next-navigation"

vi.mock("next/navigation", async () => await import("@/tests/mocks/next-navigation"))
vi.mock("next/image", async () => await import("@/tests/mocks/next-image"))
vi.mock("next/link", async () => await import("@/tests/mocks/next-link"))
vi.mock("@/modules/orders/server", () => ({ getOrderConfirmation: vi.fn() }))
vi.mock("@/modules/checkout/server", () => ({
  getBankTransferDetails: vi.fn(() => ({
    bankName: "Banco Familiar",
    accountHolder: "RIDMO SA",
    accountNumber: "123-456",
    alias: "ridmo.pay",
    notes: "",
  })),
}))
// Pulls in the checkout flow and its server action (which would load Prisma and push services).
vi.mock("@/modules/checkout/components/checkout-flow", () => ({ CheckoutFlow: () => null }))
vi.mock("@/modules/checkout/schemas/checkout.schema", () => ({
  checkoutFormSchema: {},
  createOrderInputSchema: {},
}))

import { getOrderConfirmation } from "@/modules/orders/server"
import OrderPage, { metadata } from "./page"

const order = {
  orderNumber: "RID-000042",
  status: "PENDING_PAYMENT" as const,
  currency: "PYG",
  subtotal: 100,
  total: 100,
  customerName: "Ana Perez",
  createdAt: "2026-01-15T12:00:00.000Z",
  items: [],
}

const props = (orderNumber: string, token?: string | string[]) => ({
  params: Promise.resolve({ orderNumber }),
  searchParams: Promise.resolve({ token }),
})

beforeEach(() => {
  resetNavigationMock()
  vi.mocked(getOrderConfirmation).mockReset()
})

describe("order confirmation page", () => {
  it("is kept out of search engines and referrers because the URL carries a secret", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.referrer).toBe("no-referrer")
  })

  it("renders the confirmation for a valid number and token", async () => {
    vi.mocked(getOrderConfirmation).mockResolvedValue(order)

    render(await OrderPage(props("RID-000042", "t".repeat(32))))

    expect(getOrderConfirmation).toHaveBeenCalledWith("RID-000042", "t".repeat(32))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gracias, Ana")
    expect(screen.getByText("Banco Familiar")).toBeInTheDocument()
  })

  it.each([
    ["missing", undefined],
    ["repeated", ["a", "b"]],
  ])("answers not found when the token is %s, without querying", async (_label, token) => {
    await expect(OrderPage(props("RID-000042", token))).rejects.toThrow("NEXT_NOT_FOUND")
    expect(getOrderConfirmation).not.toHaveBeenCalled()
  })

  it("answers not found when no order matches the number and token", async () => {
    vi.mocked(getOrderConfirmation).mockResolvedValue(null)

    await expect(OrderPage(props("RID-000042", "wrong-token-123456"))).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
