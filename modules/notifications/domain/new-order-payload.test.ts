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

describe("buildNewOrderPayload shipping country", () => {
  const base = { id: "o1", orderNumber: "RID-000001", total: 1500, currency: "PYG" }

  it.each([undefined, "Paraguay", "paraguay"])("does not mention a domestic destination (%j)", (shippingCountry) => {
    const payload = buildNewOrderPayload({ ...base, shippingCountry })

    expect(payload.body).toBe("RID-000001 · Gs. 1.500")
    expect(payload.body).not.toContain("Envío a")
  })

  it("appends the country when the order ships abroad", () => {
    const payload = buildNewOrderPayload({ ...base, shippingCountry: "Argentina" })

    expect(payload.body).toBe("RID-000001 · Gs. 1.500 · Envío a Argentina")
  })
})

describe("buildNewOrderPayload shipping cost", () => {
  const base = { id: "o1", orderNumber: "RID-000001", total: 21_500, currency: "PYG" }

  it("mentions the shipping already included in the total", () => {
    const payload = buildNewOrderPayload({ ...base, shippingCost: 20_000 })

    expect(payload.body).toBe("RID-000001 · Gs. 21.500 (envío Gs. 20.000 incl.)")
  })

  it.each([undefined, 0])("says nothing about shipping when it is %j", (shippingCost) => {
    expect(buildNewOrderPayload({ ...base, shippingCost }).body).toBe("RID-000001 · Gs. 21.500")
  })

  it("combines the shipping cost with a foreign destination", () => {
    const payload = buildNewOrderPayload({ ...base, shippingCost: 0, shippingCountry: "Argentina" })

    expect(payload.body).toBe("RID-000001 · Gs. 21.500 · Envío a Argentina")
  })
})

describe("buildNewOrderPayload with other currencies", () => {
  it("shows the currency code instead of the Gs. symbol", () => {
    const payload = buildNewOrderPayload({ id: "o1", orderNumber: "RID-000001", total: 1500, currency: "USD" })

    expect(payload.body).toBe("RID-000001 · USD 1.500")
  })
})
