import { Prisma } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock, txMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { placeOrder } from "./place-order"
import type { PlaceOrderInput } from "../types"

const catalogItem = (overrides: Record<string, unknown> = {}) => ({
  id: "i1",
  name: "Cadena",
  slug: "cadena",
  price: 1000,
  images: ["a.jpg"],
  inventory: 10,
  isActive: true,
  deletedAt: null,
  ...overrides,
})

const input: PlaceOrderInput = {
  customer: { fullName: "Ana Perez", phone: "+595981000000", email: "" },
  shippingAddress: {
    street: "Calle 1",
    reference: "Casa 2",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
    notes: "",
  },
  lines: [{ itemId: "i1", quantity: 2 }],
}

/** Subtotal of `input` (2 x 1000) plus the Asunción rate (Gs. 20.000). */
const ORDER_TOTAL = 22_000

/** Sequence value 12 -> RID-000012. */
function stubSequence(value = 12) {
  prismaMock.$runCommandRaw.mockResolvedValue({ value: { seq: value } })
}

function stubHappyTransaction() {
  txMock.item.updateMany.mockResolvedValue({ count: 1 })
  txMock.order.create.mockResolvedValue({
    id: "o1",
    orderNumber: "RID-000012",
    total: ORDER_TOTAL,
    currency: "PYG",
  })
}

function writeConflict() {
  return new Prisma.PrismaClientKnownRequestError("write conflict", {
    code: "P2034",
    clientVersion: "test",
  })
}

beforeEach(() => {
  resetPrismaMock()
  stubSequence()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("placeOrder: pricing and validation (nothing is written)", () => {
  it("rejects an empty cart without drawing an order number", async () => {
    prismaMock.item.findMany.mockResolvedValue([])

    await expect(placeOrder({ ...input, lines: [] })).resolves.toEqual({
      ok: false,
      code: "EMPTY_CART",
    })
    expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it("rejects unavailable products", async () => {
    prismaMock.item.findMany.mockResolvedValue([catalogItem({ isActive: false })])

    await expect(placeOrder(input)).resolves.toEqual({
      ok: false,
      code: "ITEM_UNAVAILABLE",
      itemId: "i1",
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it("rejects up front when the catalog already shows too little stock", async () => {
    prismaMock.item.findMany.mockResolvedValue([catalogItem({ inventory: 1 })])

    await expect(placeOrder(input)).resolves.toEqual({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: "i1",
      available: 1,
    })
    expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled()
  })

  it.each([undefined, "", "nope", "ASUNCION", "__proto__"])(
    "rejects a Paraguay order with the shipping option %j before touching the database",
    async (shippingOptionId) => {
      const tampered = {
        ...input,
        shippingAddress: { ...input.shippingAddress, shippingOptionId },
      } as PlaceOrderInput

      await expect(placeOrder(tampered)).resolves.toEqual({ ok: false, code: "INVALID_SHIPPING_OPTION" })
      expect(prismaMock.item.findMany).not.toHaveBeenCalled()
      expect(prismaMock.$runCommandRaw).not.toHaveBeenCalled()
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    }
  )

  it("loads each distinct item once, even when the cart repeats it", async () => {
    prismaMock.item.findMany.mockResolvedValue([catalogItem()])
    stubHappyTransaction()

    await placeOrder({
      ...input,
      lines: [
        { itemId: "i1", quantity: 1 },
        { itemId: "i1", quantity: 1 },
      ],
    })

    expect(prismaMock.item.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["i1"] } })
  })
})

describe("placeOrder: successful order", () => {
  beforeEach(() => {
    prismaMock.item.findMany.mockResolvedValue([catalogItem()])
    stubHappyTransaction()
  })

  it("returns the created order with a secret access token", async () => {
    const result = await placeOrder(input)

    expect(result).toMatchObject({
      ok: true,
      order: { id: "o1", orderNumber: "RID-000012", total: ORDER_TOTAL, shippingCost: 20_000, currency: "PYG" },
    })
    if (!result.ok) throw new Error("unreachable")
    expect(result.order.accessToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
  })

  it("issues a different access token per order", async () => {
    const first = await placeOrder(input)
    const second = await placeOrder(input)

    if (!first.ok || !second.ok) throw new Error("unreachable")
    expect(first.order.accessToken).not.toBe(second.order.accessToken)
  })

  it("persists server-side prices, never anything sent by the caller", async () => {
    const tampered = {
      ...input,
      lines: [{ itemId: "i1", quantity: 2, price: 1, total: 1 }],
    } as unknown as PlaceOrderInput

    await placeOrder(tampered)

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.subtotal).toBe(2000)
    expect(data.shippingCost).toBe(20_000)
    expect(data.total).toBe(ORDER_TOTAL)
    expect(data.items).toEqual([
      {
        itemId: "i1",
        name: "Cadena",
        slug: "cadena",
        image: "a.jpg",
        unitPrice: 1000,
        quantity: 2,
        lineTotal: 2000,
      },
    ])
  })

  it("never reads a shipping cost or total from the caller", async () => {
    const tampered = {
      ...input,
      shippingCost: 1,
      total: 1,
      shippingAddress: { ...input.shippingAddress, shippingCost: 1 },
    } as unknown as PlaceOrderInput

    await placeOrder(tampered)

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.shippingCost).toBe(20_000)
    expect(data.total).toBe(ORDER_TOTAL)
    expect(data.shippingAddress).not.toHaveProperty("shippingCost")
  })

  it("snapshots the chosen shipping option and takes the city of a city option from the model", async () => {
    await placeOrder({ ...input, shippingAddress: { ...input.shippingAddress, shippingOptionId: "luque-2", city: "Concepción" } })

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.shippingCost).toBe(35_000)
    expect(data.total).toBe(2000 + 35_000)
    expect(data.shippingAddress).toMatchObject({
      city: "Luque",
      shippingOptionId: "luque-2",
      shippingOptionLabel: "Luque 2",
    })
  })

  it("keeps the city typed by the shopper for interior deliveries", async () => {
    await placeOrder({
      ...input,
      shippingAddress: { ...input.shippingAddress, shippingOptionId: "interior-door", city: "Encarnación" },
    })

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.shippingCost).toBe(35_000)
    expect(data.shippingAddress).toMatchObject({
      city: "Encarnación",
      shippingOptionId: "interior-door",
      shippingOptionLabel: "Interior del país, entrega en puerta",
    })
  })

  it("charges no shipping to an international order and ignores any option sent with it", async () => {
    const result = await placeOrder({
      ...input,
      shippingAddress: { ...input.shippingAddress, country: "Argentina", shippingOptionId: "asuncion", city: "Rosario" },
    })

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.shippingCost).toBe(0)
    expect(data.total).toBe(2000)
    expect(data.shippingAddress).toMatchObject({
      city: "Rosario",
      shippingOptionId: null,
      shippingOptionLabel: null,
    })
    expect(result).toMatchObject({ ok: true, order: { shippingCountry: "Argentina", shippingCost: 0 } })
  })

  it("stores the order number, the public token as hash input and PYG currency", async () => {
    const result = await placeOrder(input)
    if (!result.ok) throw new Error("unreachable")

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.orderNumber).toBe("RID-000012")
    expect(data.currency).toBe("PYG")
    expect(data.publicToken).toBe(result.order.accessToken)
  })

  it("normalises empty optional contact fields to null", async () => {
    await placeOrder(input)

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.customer).toEqual({
      fullName: "Ana Perez",
      phone: "+595981000000",
      email: null,
    })
    expect(data.shippingAddress.notes).toBeNull()
  })

  it("keeps optional fields that were provided", async () => {
    await placeOrder({
      ...input,
      customer: { ...input.customer, email: "ana@example.com" },
      shippingAddress: { ...input.shippingAddress, notes: "Tocar timbre" },
    })

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.customer.email).toBe("ana@example.com")
    expect(data.shippingAddress.notes).toBe("Tocar timbre")
  })

  it("stores the country and the postal code of an international order", async () => {
    const result = await placeOrder({
      ...input,
      shippingAddress: { ...input.shippingAddress, country: "Argentina", postalCode: "C1425" },
    })

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425" })
    expect(result).toMatchObject({ ok: true, order: { shippingCountry: "Argentina" } })
  })

  it("stores a null postal code for the legacy shape and for an empty value", async () => {
    await placeOrder(input)
    await placeOrder({ ...input, shippingAddress: { ...input.shippingAddress, postalCode: "" } })

    for (const [call] of txMock.order.create.mock.calls) {
      expect(call.data.shippingAddress.postalCode).toBeNull()
      expect(call.data.shippingAddress.country).toBe("Paraguay")
    }
  })

  it("reports Paraguay as the shipping country of a domestic order", async () => {
    await expect(placeOrder(input)).resolves.toMatchObject({ ok: true, order: { shippingCountry: "Paraguay" } })
  })

  it("stores the order in guaranies and no longer records any display country or currency", async () => {
    await placeOrder(input)

    const data = txMock.order.create.mock.calls[0][0].data
    expect(data.currency).toBe("PYG")
    expect(data).not.toHaveProperty("displayCountry")
    expect(data).not.toHaveProperty("displayCurrency")
  })

  it("reserves stock with a guarded decrement for every line inside the transaction", async () => {
    prismaMock.item.findMany.mockResolvedValue([
      catalogItem(),
      catalogItem({ id: "i2", slug: "otro", name: "Otro" }),
    ])

    await placeOrder({
      ...input,
      lines: [
        { itemId: "i1", quantity: 2 },
        { itemId: "i2", quantity: 3 },
      ],
    })

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: "i1", isActive: true, inventory: { gte: 2 } },
      data: { inventory: { decrement: 2 } },
    })
    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: "i2", isActive: true, inventory: { gte: 3 } },
      data: { inventory: { decrement: 3 } },
    })
  })
})

describe("placeOrder: concurrency", () => {
  beforeEach(() => {
    prismaMock.item.findMany.mockResolvedValue([catalogItem()])
  })

  it("answers INSUFFICIENT_STOCK with the live availability when another buyer won the race", async () => {
    txMock.item.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.item.findUnique.mockResolvedValue({ inventory: 1 })

    await expect(placeOrder(input)).resolves.toEqual({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: "i1",
      available: 1,
    })
    expect(txMock.order.create).not.toHaveBeenCalled()
    expect(prismaMock.item.findUnique.mock.calls[0][0].where).toEqual({ id: "i1" })
  })

  it("reports zero availability when the item vanished meanwhile", async () => {
    txMock.item.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.item.findUnique.mockResolvedValue(null)

    const result = await placeOrder(input)

    expect(result).toMatchObject({ ok: false, code: "INSUFFICIENT_STOCK", available: 0 })
  })

  it("never reports negative availability", async () => {
    txMock.item.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.item.findUnique.mockResolvedValue({ inventory: -3 })

    const result = await placeOrder(input)

    expect(result).toMatchObject({ available: 0 })
  })

  it("retries a write conflict (P2034) and succeeds without double-drawing the order number", async () => {
    vi.useFakeTimers()
    prismaMock.$transaction
      .mockRejectedValueOnce(writeConflict())
      .mockImplementationOnce(async (callback: (tx: typeof txMock) => unknown) => callback(txMock))
    stubHappyTransaction()

    const pending = placeOrder(input)
    await vi.runAllTimersAsync()
    const result = await pending

    expect(result).toMatchObject({ ok: true })
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2)
    expect(prismaMock.$runCommandRaw).toHaveBeenCalledTimes(1)
  })

  it("rethrows a write conflict after 8 attempts", async () => {
    vi.useFakeTimers()
    prismaMock.$transaction.mockRejectedValue(writeConflict())

    const pending = placeOrder(input)
    const assertion = expect(pending).rejects.toThrow("write conflict")
    await vi.runAllTimersAsync()
    await assertion

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(8)
  })

  it("does not retry unrelated errors", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("boom"))

    await expect(placeOrder(input)).rejects.toThrow("boom")
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it("does not treat other Prisma error codes as retryable conflicts", async () => {
    prismaMock.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" })
    )

    await expect(placeOrder(input)).rejects.toThrow("unique")
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})
