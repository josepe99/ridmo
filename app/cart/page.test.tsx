import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const checkoutFlow = vi.hoisted(() => vi.fn((_props: { defaults?: unknown; bank?: unknown }) => <p>checkout flow</p>))
vi.mock("@/modules/checkout", () => ({ CheckoutFlow: checkoutFlow }))
const bank = { bankName: "Banco Ueno", accountHolder: "RIDMO S.A.", accountNumber: "123", alias: "ridmo.pay", notes: "" }
vi.mock("@/modules/checkout/server", () => ({ getBankTransferDetails: vi.fn(() => bank) }))
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn(async () => null) }))
vi.mock("@/modules/orders/server", () => ({ getCheckoutDefaults: vi.fn() }))

import { getCheckoutDefaults } from "@/modules/orders/server"
import { getCurrentUser } from "@/modules/users/server"
import CartPage, { metadata } from "./page"

describe("cart page", () => {
  it("renders the checkout flow", async () => {
    const { getByText } = render(await CartPage())

    expect(getByText("checkout flow")).toBeInTheDocument()
  })

  it("renders an empty form for guests", async () => {
    render(await CartPage())

    expect(checkoutFlow.mock.lastCall?.[0]).toEqual({ defaults: undefined, bank })
  })

  it("prefills the form for a signed-in customer", async () => {
    const defaults = { customer: { fullName: "Ana", phone: "", email: "a@b.co" } }
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "u1", name: "Ana", email: "a@b.co", image: null, role: "USER" })
    vi.mocked(getCheckoutDefaults).mockResolvedValueOnce(defaults)

    render(await CartPage())

    expect(getCheckoutDefaults).toHaveBeenCalledWith(expect.objectContaining({ id: "u1" }))
    expect(checkoutFlow.mock.lastCall?.[0]).toEqual({ defaults, bank })
  })

  it("falls back to the empty form when the session lookup fails", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("auth down"))

    render(await CartPage())

    expect(checkoutFlow.mock.lastCall?.[0]).toEqual({ defaults: undefined, bank })
  })

  it("passes the server-side bank transfer details to the payment step", async () => {
    render(await CartPage())

    expect(checkoutFlow.mock.lastCall?.[0].bank).toEqual(bank)
  })

  it("is not indexed by search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe("Tu bolsa | RIDMO")
  })
})
