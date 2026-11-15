import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { getOrderConfirmation, getOrderDetail, listOrders } from "./order-queries"

const OBJECT_ID = "64b7f0a0a0a0a0a0a0a0a0a0"
const createdAt = new Date("2026-01-15T12:00:00.000Z")
const updatedAt = new Date("2026-01-16T12:00:00.000Z")

const line = {
  itemId: "i1",
  name: "Cadena",
  slug: "cadena",
  image: null as string | null,
  unitPrice: 100,
  quantity: 2,
  lineTotal: 200,
}

beforeEach(() => resetPrismaMock())

describe("listOrders", () => {
  const row = {
    id: "o1",
    orderNumber: "RID-000001",
    status: "PENDING_PAYMENT",
    total: 300,
    currency: "PYG",
    createdAt,
    customer: { fullName: "Ana Perez" },
    shippingAddress: { country: "Argentina" },
    items: [{ quantity: 2 }, { quantity: 1 }],
  }

  it("summarises each order with the customer name and the sum of unit quantities", async () => {
    prismaMock.order.findMany.mockResolvedValue([row])

    await expect(listOrders()).resolves.toEqual([
      {
        id: "o1",
        orderNumber: "RID-000001",
        status: "PENDING_PAYMENT",
        total: 300,
        currency: "PYG",
        customerName: "Ana Perez",
        shippingCountry: "Argentina",
        itemCount: 3,
        createdAt: "2026-01-15T12:00:00.000Z",
      },
    ])
  })

  it("selects only the country of the shipping address, never the street or notes", async () => {
    prismaMock.order.findMany.mockResolvedValue([])

    await listOrders()

    expect(prismaMock.order.findMany.mock.calls[0][0].select.shippingAddress).toEqual({ select: { country: true } })
  })

  it("asks for newest first and applies the limit (100 by default)", async () => {
    prismaMock.order.findMany.mockResolvedValue([])

    await listOrders()
    await listOrders(5)

    expect(prismaMock.order.findMany.mock.calls[0][0]).toMatchObject({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    expect(prismaMock.order.findMany.mock.calls[1][0].take).toBe(5)
  })

  it("fails loudly when a stored order has an unknown status", async () => {
    prismaMock.order.findMany.mockResolvedValue([{ ...row, status: "LOST" }])

    await expect(listOrders()).rejects.toThrow("Unknown order status: LOST")
  })
})

describe("getOrderDetail", () => {
  const order = {
    id: OBJECT_ID,
    orderNumber: "RID-000002",
    status: "SHIPPED",
    subtotal: 200,
    total: 200,
    currency: "PYG",
    customer: { fullName: "Ana Perez", phone: "+595981000000", email: null },
    shippingAddress: {
      street: "Calle 1",
      reference: "Casa 2",
      city: "Asuncion",
      department: "Central",
      country: "Paraguay",
      notes: null,
    },
    items: [line, { ...line, itemId: "i2", quantity: 3, image: "x.jpg" }],
    displayCountry: null,
    displayCurrency: null,
    createdAt,
    updatedAt,
  }

  it.each(["", "abc", "64b7f0a0a0a0a0a0a0a0a0", "zzzzzzzzzzzzzzzzzzzzzzzz", `${OBJECT_ID}0`])(
    "returns null without querying when the id is not an ObjectId: %j",
    async (id) => {
      await expect(getOrderDetail(id)).resolves.toBeNull()
      expect(prismaMock.order.findUnique).not.toHaveBeenCalled()
    }
  )

  it("returns null when the order does not exist", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null)

    await expect(getOrderDetail(OBJECT_ID)).resolves.toBeNull()
  })

  it("builds the full admin detail, normalising missing optional fields to null", async () => {
    prismaMock.order.findUnique.mockResolvedValue(order)

    const detail = await getOrderDetail(OBJECT_ID)

    expect(detail).toMatchObject({
      id: OBJECT_ID,
      orderNumber: "RID-000002",
      status: "SHIPPED",
      paymentMethod: "TRANSFER",
      itemCount: 5,
      customerName: "Ana Perez",
      customer: { fullName: "Ana Perez", phone: "+595981000000", email: null },
      displayCountry: null,
      displayCurrency: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-16T12:00:00.000Z",
    })
    expect(detail?.shippingAddress.notes).toBeNull()
    expect(detail?.shippingAddress.postalCode).toBeNull()
    expect(detail?.items.map((item) => item.image)).toEqual([null, "x.jpg"])
  })

  it("exposes the country and the postal code of an international order", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      shippingAddress: { ...order.shippingAddress, country: "Argentina", postalCode: "C1425" },
    })

    const detail = await getOrderDetail(OBJECT_ID)

    expect(detail?.shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425" })
  })

  it("reads a legacy document stored without a postal code", async () => {
    expect(order.shippingAddress).not.toHaveProperty("postalCode")
    prismaMock.order.findUnique.mockResolvedValue(order)

    const detail = await getOrderDetail(OBJECT_ID)

    expect(detail?.shippingAddress).toMatchObject({ country: "Paraguay", postalCode: null })
  })

  it("keeps display currency data when the shopper saw converted prices", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      displayCountry: "AR",
      displayCurrency: "ARS",
    })

    const detail = await getOrderDetail(OBJECT_ID)

    expect(detail).toMatchObject({ displayCountry: "AR", displayCurrency: "ARS" })
  })
})

describe("getOrderConfirmation", () => {
  const token = "t".repeat(32)
  const confirmation = {
    orderNumber: "RID-000003",
    status: "PENDING_PAYMENT",
    currency: "PYG",
    subtotal: 200,
    total: 200,
    createdAt,
    customer: { fullName: "Ana Perez" },
    shippingAddress: { country: "Argentina" },
    items: [line],
  }

  it.each([
    ["a malformed order number", "ORDER-1", token],
    ["a token shorter than 16 chars", "RID-000003", "short"],
    ["a token longer than 128 chars", "RID-000003", "t".repeat(129)],
  ])("returns null without querying for %s", async (_label, orderNumber, accessToken) => {
    await expect(getOrderConfirmation(orderNumber, accessToken)).resolves.toBeNull()
    expect(prismaMock.order.findFirst).not.toHaveBeenCalled()
  })

  it("looks the order up by number AND secret token", async () => {
    prismaMock.order.findFirst.mockResolvedValue(confirmation)

    await getOrderConfirmation("RID-000003", token)

    expect(prismaMock.order.findFirst.mock.calls[0][0].where).toEqual({
      orderNumber: "RID-000003",
      publicToken: token,
    })
  })

  it("returns null when the token does not match any order", async () => {
    prismaMock.order.findFirst.mockResolvedValue(null)

    await expect(getOrderConfirmation("RID-000003", token)).resolves.toBeNull()
  })

  it("exposes only non-sensitive data (no contact info, address or token)", async () => {
    prismaMock.order.findFirst.mockResolvedValue(confirmation)

    const result = await getOrderConfirmation("RID-000003", token)

    expect(result).toEqual({
      shippingCountry: "Argentina",
      orderNumber: "RID-000003",
      status: "PENDING_PAYMENT",
      currency: "PYG",
      subtotal: 200,
      total: 200,
      customerName: "Ana Perez",
      items: [line],
      createdAt: "2026-01-15T12:00:00.000Z",
    })
    expect(JSON.stringify(result)).not.toContain(token)
  })

  it("selects only the country of the shipping address", async () => {
    prismaMock.order.findFirst.mockResolvedValue(confirmation)

    await getOrderConfirmation("RID-000003", token)

    expect(prismaMock.order.findFirst.mock.calls[0][0].select.shippingAddress).toEqual({ select: { country: true } })
  })
})
