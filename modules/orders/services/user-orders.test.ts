import { beforeEach, describe, expect, it, vi } from "vitest"
import { authPrismaMock, resetAuthPrismaMock } from "@/tests/mocks/auth-prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/auth-prisma")).authPrismaModule)

import { getCheckoutDefaults, listOrdersForUser } from "./user-orders"

const ME = "64b7f0a0a0a0a0a0a0a0a0a1"
const SOMEONE_ELSE = "64b7f0a0a0a0a0a0a0a0a0a2"

const orderRow = (overrides: Record<string, unknown> = {}) => ({
  id: "o1",
  orderNumber: "RID-000001",
  status: "PENDING_PAYMENT",
  total: 2000,
  currency: "PYG",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  items: [{ quantity: 2 }, { quantity: 1 }],
  ...overrides,
})

beforeEach(() => resetAuthPrismaMock())

describe("listOrdersForUser (IDOR guard)", () => {
  it("only ever queries orders owned by the given user id", async () => {
    authPrismaMock.order.findMany.mockResolvedValue([orderRow()])
    await listOrdersForUser(ME)
    const args = authPrismaMock.order.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ userId: ME })
  })

  it("does not return another user's orders even if the database returned them", async () => {
    authPrismaMock.order.findMany.mockResolvedValue([orderRow({ userId: SOMEONE_ELSE })])
    // The query is the authorization boundary: the where clause above is what prevents this.
    // Defence in depth: rows are also filtered by owner when the column is present.
    const orders = await listOrdersForUser(ME)
    expect(orders).toEqual([])
  })

  it.each(["", "   ", "not-an-id", "*", "64b7f0a0a0a0a0a0a0a0a0a", "../etc"])(
    "refuses an invalid user id %j without querying",
    async (userId) => {
      await expect(listOrdersForUser(userId)).resolves.toEqual([])
      expect(authPrismaMock.order.findMany).not.toHaveBeenCalled()
    }
  )

  it("maps to a summary without contact data, address or the secret access token", async () => {
    authPrismaMock.order.findMany.mockResolvedValue([orderRow({ userId: ME, publicToken: "secret-token" })])
    const [order] = await listOrdersForUser(ME)
    expect(order).toEqual({
      id: "o1",
      orderNumber: "RID-000001",
      status: "PENDING_PAYMENT",
      total: 2000,
      currency: "PYG",
      itemCount: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
    })
    expect(authPrismaMock.order.findMany.mock.calls[0][0].select).not.toHaveProperty("publicToken")
  })

  it("lists newest first with a hard cap", async () => {
    authPrismaMock.order.findMany.mockResolvedValue([])
    await listOrdersForUser(ME, 500)
    const args = authPrismaMock.order.findMany.mock.calls[0][0]
    expect(args.orderBy).toEqual({ createdAt: "desc" })
    expect(args.take).toBeLessThanOrEqual(100)
  })
})

describe("getCheckoutDefaults", () => {
  it("prefills from the user's latest order, scoped by user id", async () => {
    authPrismaMock.order.findFirst.mockResolvedValue({
      customer: { fullName: "Ana Perez", phone: "+595981000000", email: "ana@example.com" },
      shippingAddress: { street: "Calle 1", reference: "Casa 2", city: "Asuncion", department: "Central", country: "Paraguay", notes: null },
    })
    const defaults = await getCheckoutDefaults({ id: ME, name: "Ana", email: "ana@example.com" })

    expect(authPrismaMock.order.findFirst.mock.calls[0][0]).toMatchObject({
      where: { userId: ME },
      orderBy: { createdAt: "desc" },
    })
    expect(defaults).toEqual({
      customer: { fullName: "Ana Perez", phone: "+595981000000", email: "ana@example.com" },
      shippingAddress: { street: "Calle 1", reference: "Casa 2", city: "Asuncion", department: "Central", country: "Paraguay", postalCode: "", notes: "" },
    })
  })

  it("prefills the saved country and postal code of an international order", async () => {
    authPrismaMock.order.findFirst.mockResolvedValue({
      customer: { fullName: "Ana Perez", phone: "+595981000000", email: null },
      shippingAddress: { street: "Calle 1", reference: "Casa 2", city: "Buenos Aires", department: "CABA", country: "Argentina", postalCode: "C1425", notes: null },
    })
    const defaults = await getCheckoutDefaults({ id: ME, name: "Ana", email: "ana@example.com" })

    expect(defaults.shippingAddress).toMatchObject({ country: "Argentina", postalCode: "C1425" })
  })

  it("falls back to the account name and email when the user has no orders yet", async () => {
    authPrismaMock.order.findFirst.mockResolvedValue(null)
    const defaults = await getCheckoutDefaults({ id: ME, name: "Ana", email: "ana@example.com" })
    expect(defaults).toEqual({ customer: { fullName: "Ana", phone: "", email: "ana@example.com" } })
  })

  it("tolerates a user without a name", async () => {
    authPrismaMock.order.findFirst.mockResolvedValue(null)
    const defaults = await getCheckoutDefaults({ id: ME, name: null, email: "ana@example.com" })
    expect(defaults.customer?.fullName).toBe("")
  })
})
