import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  // Outside a request scope the real `after` throws; run the callback immediately.
  after: vi.fn((callback: () => unknown) => {
    void callback()
  }),
}))
vi.mock("@/modules/orders/server", () => ({ placeOrder: vi.fn() }))
vi.mock("@/modules/notifications/server", () => ({ notifyNewOrder: vi.fn(), notifyCustomerOrderReceived: vi.fn() }))
// Guest checkout: no signed-in user (ownership is covered in create-order.user.test.ts).
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn(async () => null) }))

import { after } from "next/server"
import { notifyCustomerOrderReceived, notifyNewOrder } from "@/modules/notifications/server"
import { placeOrder } from "@/modules/orders/server"
import { createOrder } from "./create-order.action"

const validInput = {
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "ana@example.com" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    notes: "Tocar timbre",
  },
  lines: [{ itemId: "64b7f0a0a0a0a0a0a0a0a0a0", quantity: 2 }],
}

const placed = {
  ok: true as const,
  order: {
    id: "o1",
    orderNumber: "RID-000001",
    shippingCountry: "Paraguay",
    customerName: "Ana Perez",
    customerEmail: "ana@example.com",
    accessToken: "secret-token-1234567890",
    shippingCost: 20_000,
    total: 22_000,
    currency: "PYG",
  },
}

beforeEach(() => {
  vi.mocked(placeOrder).mockReset()
  vi.mocked(notifyNewOrder).mockReset().mockResolvedValue(1)
  vi.mocked(notifyCustomerOrderReceived).mockReset().mockResolvedValue(true)
  vi.mocked(after).mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("createOrder: validation", () => {
  it("returns VALIDATION with dotted field paths and never calls placeOrder", async () => {
    const result = await createOrder({
      ...validInput,
      customer: { fullName: "", phone: "abc" },
    })

    expect(result).toMatchObject({ ok: false, code: "VALIDATION", message: "Revisá los datos ingresados." })
    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors["customer.fullName"]).toBe("Completá este campo")
    expect(result.fieldErrors["customer.phone"]).toBe("Ingresá un teléfono válido")
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("keeps only the first message per field", async () => {
    const result = await createOrder({ ...validInput, customer: { fullName: "", phone: "+595981000000" } })

    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors["customer.fullName"]).toBe("Completá este campo")
  })

  it("flags an invalid cart line with its index in the path", async () => {
    const result = await createOrder({ ...validInput, lines: [{ itemId: "bad", quantity: 1 }] })

    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors["lines.0.itemId"]).toBe("Producto inválido")
  })

  it("rejects non-object payloads", async () => {
    await expect(createOrder(null)).resolves.toMatchObject({ ok: false, code: "VALIDATION" })
    await expect(createOrder("hola")).resolves.toMatchObject({ ok: false, code: "VALIDATION" })
  })

  it("does not pass client-supplied prices through to the order service", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await createOrder({
      ...validInput,
      lines: [{ itemId: "64b7f0a0a0a0a0a0a0a0a0a0", quantity: 2, price: 1 }],
      total: 1,
    })

    const sent = vi.mocked(placeOrder).mock.calls[0][0]
    expect(sent.lines).toEqual([{ itemId: "64b7f0a0a0a0a0a0a0a0a0a0", quantity: 2 }])
    expect(sent).not.toHaveProperty("total")
  })
})

describe("createOrder: delivery location", () => {
  const mapAddress = {
    city: "Asuncion",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    notes: "Portón verde",
    locationMode: "map",
    location: { lat: -25.2637, lng: -57.5759 },
  }
  const withAddress = (shippingAddress: Record<string, unknown>) => ({ ...validInput, shippingAddress })

  it("accepts a map payload without street, reference or department and forwards the pin", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    const result = await createOrder(withAddress(mapAddress))

    expect(result).toMatchObject({ ok: true, orderNumber: "RID-000001" })
    expect(vi.mocked(placeOrder).mock.calls[0][0].shippingAddress).toMatchObject({
      locationMode: "map",
      location: { lat: -25.2637, lng: -57.5759 },
      shippingOptionId: "asuncion",
    })
  })

  it("still accepts the written payload and forwards no pin", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await expect(createOrder(validInput)).resolves.toMatchObject({ ok: true })

    const sent = vi.mocked(placeOrder).mock.calls[0][0].shippingAddress
    expect(sent.street).toBe("Calle Palma 123")
    expect(sent.location ?? null).toBeNull()
  })

  it("rejects map mode without a pin with a field error and never places the order", async () => {
    const result = await createOrder(withAddress({ ...mapAddress, location: null }))

    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors["shippingAddress.location"]).toBe("Marcá tu ubicación en el mapa")
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it.each([
    { lat: 91, lng: 0 },
    { lat: 0, lng: -181 },
    { lat: Number.NaN, lng: 0 },
  ])("rejects the out-of-range pin %j", async (location) => {
    const result = await createOrder(withAddress({ ...mapAddress, location }))

    expect(result).toMatchObject({ ok: false, code: "VALIDATION" })
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("requires delivery notes in both modes", async () => {
    for (const address of [{ ...validInput.shippingAddress, notes: "" }, { ...mapAddress, notes: "  " }]) {
      const result = await createOrder(withAddress(address))

      if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
      expect(result.fieldErrors["shippingAddress.notes"]).toBe("Completá este campo")
    }
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("never accepts a price next to a map pin", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await createOrder(withAddress({ ...mapAddress, shippingCost: 1 }))

    expect(vi.mocked(placeOrder).mock.calls[0][0].shippingAddress).not.toHaveProperty("shippingCost")
  })
})

describe("createOrder: shipping country", () => {
  const withAddress = (overrides: Record<string, unknown>) => ({
    ...validInput,
    shippingAddress: { ...validInput.shippingAddress, ...overrides },
  })

  it.each(["Narnia", "", "argentina", "<script>alert(1)</script>", "Paraguay; DROP TABLE orders", "__proto__"])(
    "rejects the country %j on the server and never places the order",
    async (country) => {
      const result = await createOrder(withAddress({ country }))

      expect(result).toMatchObject({ ok: false, code: "VALIDATION" })
      if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
      expect(Object.keys(result.fieldErrors)).toContain("shippingAddress.country")
      expect(placeOrder).not.toHaveBeenCalled()
    }
  )

  it("rejects a postal code with disallowed characters", async () => {
    const result = await createOrder(withAddress({ country: "Argentina", postalCode: "<b>1</b>" }))

    if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
    expect(result.fieldErrors["shippingAddress.postalCode"]).toBeDefined()
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it("places an international order with its country and postal code, still without prices from the client", async () => {
    vi.mocked(placeOrder).mockResolvedValue({
      ok: true,
      order: { ...placed.order, shippingCountry: "Argentina" },
    })

    await expect(
      createOrder({ ...withAddress({ country: " Argentina ", postalCode: " C1425 " }), total: 1 })
    ).resolves.toMatchObject({ ok: true })

    const sent = vi.mocked(placeOrder).mock.calls[0][0]
    expect(sent.shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425" })
    expect(sent).not.toHaveProperty("total")
    expect(notifyNewOrder).toHaveBeenCalledWith(expect.objectContaining({ shippingCountry: "Argentina" }))
  })

  it("keeps accepting the legacy Paraguay payload without postal code", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await expect(createOrder(validInput)).resolves.toMatchObject({ ok: true })
    expect(vi.mocked(placeOrder).mock.calls[0][0].shippingAddress.postalCode).toBeUndefined()
  })
})

describe("createOrder: shipping option", () => {
  const withAddress = (overrides: Record<string, unknown>) => ({
    ...validInput,
    shippingAddress: { ...validInput.shippingAddress, ...overrides },
  })

  it.each([undefined, "", "nope"])(
    "rejects a Paraguay order with the shipping option %j and never places it",
    async (shippingOptionId) => {
      const result = await createOrder(withAddress({ shippingOptionId }))

      expect(result).toMatchObject({ ok: false, code: "VALIDATION" })
      if (result.ok || result.code !== "VALIDATION") throw new Error("unreachable")
      expect(result.fieldErrors["shippingAddress.shippingOptionId"]).toBe("Elegí una zona de envío")
      expect(placeOrder).not.toHaveBeenCalled()
    }
  )

  it("forwards only the option id: any cost sent by the client is dropped", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await createOrder({
      ...withAddress({ shippingOptionId: "luque-2", shippingCost: 1 }),
      shippingCost: 1,
      total: 1,
    })

    const sent = vi.mocked(placeOrder).mock.calls[0][0]
    expect(sent.shippingAddress.shippingOptionId).toBe("luque-2")
    expect(JSON.stringify(sent)).not.toContain("shippingCost")
    expect(sent).not.toHaveProperty("total")
  })

  it("accepts an international order without any shipping option", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ ok: true, order: { ...placed.order, shippingCountry: "Argentina", shippingCost: 0 } })

    await expect(createOrder(withAddress({ country: "Argentina", shippingOptionId: undefined }))).resolves.toMatchObject({
      ok: true,
    })
  })

  it("maps INVALID_SHIPPING_OPTION from the order service to a clear message", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ ok: false, code: "INVALID_SHIPPING_OPTION" })

    await expect(createOrder(validInput)).resolves.toEqual({
      ok: false,
      code: "INVALID_SHIPPING_OPTION",
      message: "Elegí una zona de envío válida para continuar.",
    })
    expect(notifyNewOrder).not.toHaveBeenCalled()
  })
})

describe("createOrder: success", () => {
  it("returns the order number and the access token", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await expect(createOrder(validInput)).resolves.toEqual({
      ok: true,
      orderNumber: "RID-000001",
      accessToken: "secret-token-1234567890",
    })
  })

  it("notifies the admins after the response via after()", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await createOrder(validInput)

    expect(after).toHaveBeenCalledTimes(1)
    expect(notifyNewOrder).toHaveBeenCalledWith(placed.order)
  })

  it("emails the customer that the order is being verified", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)

    await createOrder(validInput)

    expect(notifyCustomerOrderReceived).toHaveBeenCalledWith({
      orderNumber: "RID-000001",
      customerName: "Ana Perez",
      customerEmail: "ana@example.com",
      total: 22_000,
      currency: "PYG",
    })
  })

  it("still succeeds when the push notification rejects", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)
    vi.mocked(notifyNewOrder).mockRejectedValue(new Error("push down"))
    const unhandled = vi.fn()
    process.on("unhandledRejection", unhandled)

    const result = await createOrder(validInput)
    await new Promise((resolve) => setTimeout(resolve, 0))
    process.off("unhandledRejection", unhandled)

    expect(result).toMatchObject({ ok: true })
  })

  it("falls back to fire-and-forget when after() is unavailable outside a request", async () => {
    vi.mocked(placeOrder).mockResolvedValue(placed)
    vi.mocked(after).mockImplementationOnce(() => {
      throw new Error("after called outside a request scope")
    })

    const result = await createOrder(validInput)

    expect(result).toMatchObject({ ok: true })
    expect(notifyNewOrder).toHaveBeenCalledWith(placed.order)
  })
})

describe("createOrder: domain failures", () => {
  it("maps EMPTY_CART to a friendly message", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ ok: false, code: "EMPTY_CART" })

    await expect(createOrder(validInput)).resolves.toEqual({
      ok: false,
      code: "EMPTY_CART",
      message: "Tu carrito está vacío.",
    })
  })

  it.each([
    ["INVALID_QUANTITY", "La cantidad de uno de tus productos no es válida."],
    [
      "ITEM_UNAVAILABLE",
      "Uno de tus productos ya no está disponible. Quitalo del carrito para continuar.",
    ],
  ] as const)("maps %s and reports which item failed", async (code, message) => {
    vi.mocked(placeOrder).mockResolvedValue({ ok: false, code, itemId: "i9" })

    await expect(createOrder(validInput)).resolves.toEqual({ ok: false, code, message, itemId: "i9" })
  })

  it("reports how many units remain when stock is short", async () => {
    vi.mocked(placeOrder).mockResolvedValue({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: "i9",
      available: 3,
    })

    await expect(createOrder(validInput)).resolves.toEqual({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: "i9",
      available: 3,
      message: "Solo quedan 3 unidades de uno de tus productos.",
    })
  })

  it("tells the shopper to remove a sold-out product", async () => {
    vi.mocked(placeOrder).mockResolvedValue({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: "i9",
      available: 0,
    })

    await expect(createOrder(validInput)).resolves.toMatchObject({
      available: 0,
      message: "Uno de tus productos se agotó. Quitalo del carrito para continuar.",
    })
  })

  it("never notifies admins when the order failed", async () => {
    vi.mocked(placeOrder).mockResolvedValue({ ok: false, code: "EMPTY_CART" })

    await createOrder(validInput)

    expect(notifyNewOrder).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it("answers INTERNAL (and hides the error) when placeOrder throws", async () => {
    vi.mocked(placeOrder).mockRejectedValue(new Error("mongo exploded: secret details"))

    const result = await createOrder(validInput)

    expect(result).toEqual({
      ok: false,
      code: "INTERNAL",
      message: "No pudimos registrar tu pedido. Intentá de nuevo en unos minutos.",
    })
    expect(JSON.stringify(result)).not.toContain("secret details")
    expect(notifyNewOrder).not.toHaveBeenCalled()
  })
})
