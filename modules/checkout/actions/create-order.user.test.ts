import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn((callback: () => unknown) => {
    void callback()
  }),
}))
vi.mock("@/modules/orders/server", () => ({ placeOrder: vi.fn() }))
vi.mock("@/modules/notifications/server", () => ({ notifyNewOrder: vi.fn() }))
vi.mock("@/modules/users/server", () => ({ getCurrentUser: vi.fn() }))

import { placeOrder } from "@/modules/orders/server"
import { getCurrentUser } from "@/modules/users/server"
import { createOrder } from "./create-order.action"

const validInput = {
  customer: { fullName: "Ana Perez", phone: "+595 981 000 000", email: "" },
  shippingAddress: {
    street: "Calle Palma 123",
    reference: "Casa 12",
    city: "Asuncion",
    department: "Central",
    country: "Paraguay",
    shippingOptionId: "asuncion",
  },
  lines: [{ itemId: "64b7f0a0a0a0a0a0a0a0a0a0", quantity: 2 }],
}

const placed = {
  ok: true as const,
  order: { id: "o1", orderNumber: "RID-000001", shippingCountry: "Paraguay", accessToken: "secret-token-1234567890", shippingCost: 20_000, total: 22_000, currency: "PYG" },
}

beforeEach(() => {
  vi.mocked(placeOrder).mockReset().mockResolvedValue(placed)
  vi.mocked(getCurrentUser).mockReset().mockResolvedValue(null)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("createOrder: ownership", () => {
  it("stores the logged-in user's id on the order", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1", name: "Ana", email: "a@b.co", image: null, role: "USER" })
    await createOrder(validInput)
    expect(placeOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }))
  })

  it("keeps guest checkout working: no userId at all", async () => {
    await createOrder(validInput)
    const arg = vi.mocked(placeOrder).mock.calls[0][0]
    expect(arg).not.toHaveProperty("userId")
  })

  it("ignores a userId smuggled in by the client (an order can only be attached to the session user)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    await createOrder({ ...validInput, userId: "victim-id" })
    expect(vi.mocked(placeOrder).mock.calls[0][0]).not.toHaveProperty("userId")

    vi.mocked(placeOrder).mockClear()
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "me", name: null, email: "a@b.co", image: null, role: "USER" })
    await createOrder({ ...validInput, userId: "victim-id" })
    expect(vi.mocked(placeOrder).mock.calls[0][0]).toMatchObject({ userId: "me" })
  })

  it("still places the order as a guest when the session lookup fails", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("auth down"))
    const result = await createOrder(validInput)
    expect(result).toMatchObject({ ok: true })
    expect(vi.mocked(placeOrder).mock.calls[0][0]).not.toHaveProperty("userId")
  })
})
