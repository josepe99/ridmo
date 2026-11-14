import { describe, expect, it } from "vitest"
import { buildNewOrderPayload } from "./new-order-payload"

describe("buildNewOrderPayload", () => {
  const payload = buildNewOrderPayload({
    id: "665f1c2e8b3a4d0012a1b0ff",
    orderNumber: "RID-000123",
    total: 6_800_000,
    currency: "PYG",
  })

  it("uses the fixed notification title", () => {
    expect(payload.title).toBe("Nuevo pedido")
  })

  it("mentions the order number and the formatted total in the body", () => {
    expect(payload.body).toContain("RID-000123")
    expect(payload.body).toMatch(/6\.800\.000/)
  })

  it("deep links to the admin order detail", () => {
    expect(payload.url).toBe("/admin/orders/665f1c2e8b3a4d0012a1b0ff")
  })

  it("uses a stable tag per order so duplicates collapse", () => {
    expect(payload.tag).toBe("order-RID-000123")
  })
})

describe("buildNewOrderPayload with other currencies", () => {
  it("shows the currency code instead of the Gs. symbol", () => {
    const payload = buildNewOrderPayload({ id: "o1", orderNumber: "RID-000001", total: 1500, currency: "USD" })

    expect(payload.body).toBe("RID-000001 · USD 1.500")
  })
})
