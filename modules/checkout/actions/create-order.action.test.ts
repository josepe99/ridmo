import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  // Outside a request scope the real `after` throws; run the callback immediately.
  after: vi.fn((callback: () => unknown) => {
    void callback()
  }),
}))
vi.mock("@/modules/orders/server", () => ({ placeOrder: vi.fn() }))
vi.mock("@/modules/notifications/server", () => ({ notifyNewOrder: vi.fn() }))
// Guest checkout: no signed-in user (ownership is covered in create-order.user.test.ts).
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn(async () => null) }))

import { after } from "next/server"
import { notifyNewOrder } from "@/modules/notifications/server"
import { placeOrder } from "@/modules/orders/server"
import { createOrder } from "./create-order.action"

const validInput = {
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
  },
  lines: [{ itemId: "64b7f0a0a0a0a0a0a0a0a0a0", quantity: 2 }],
}

const placed = {
  ok: true as const,
  order: {
    id: "o1",
    orderNumber: "RID-000001",
    accessToken: "secret-token-1234567890",
    total: 2000,
    currency: "PYG",
  },
}

beforeEach(() => {
  vi.mocked(placeOrder).mockReset()
  vi.mocked(notifyNewOrder).mockReset().mockResolvedValue(1)
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
