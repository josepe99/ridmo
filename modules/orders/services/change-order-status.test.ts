import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock, txMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { changeOrderStatus } from "./change-order-status"

const items = [
  { itemId: "i1", quantity: 2 },
  { itemId: "i2", quantity: 5 },
]

beforeEach(() => resetPrismaMock())

describe("changeOrderStatus", () => {
  it("returns NOT_FOUND when the order does not exist", async () => {
    txMock.order.findUnique.mockResolvedValue(null)

    await expect(changeOrderStatus("o1", "PAYMENT_CONFIRMED")).resolves.toEqual({
      ok: false,
      code: "NOT_FOUND",
    })
    expect(txMock.order.updateMany).not.toHaveBeenCalled()
  })

  it("rejects transitions the lifecycle does not allow without writing", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "PENDING_PAYMENT", items })

    await expect(changeOrderStatus("o1", "DELIVERED")).resolves.toEqual({
      ok: false,
      code: "INVALID_TRANSITION",
    })
    expect(txMock.order.updateMany).not.toHaveBeenCalled()
  })

  it("rejects orders stored with an unknown status", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "WEIRD", items })

    await expect(changeOrderStatus("o1", "CANCELLED")).resolves.toEqual({
      ok: false,
      code: "INVALID_TRANSITION",
    })
  })

  it("moves the order forward conditioned on the status it just read", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "PENDING_PAYMENT", items })
    txMock.order.updateMany.mockResolvedValue({ count: 1 })

    await expect(changeOrderStatus("o1", "PAYMENT_CONFIRMED")).resolves.toEqual({
      ok: true,
      status: "PAYMENT_CONFIRMED",
    })

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: "o1", status: "PENDING_PAYMENT" },
      data: { status: "PAYMENT_CONFIRMED" },
    })
    expect(txMock.item.updateMany).not.toHaveBeenCalled()
  })

  it("reports CONFLICT and does not restock when another admin changed the order first", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "PENDING_PAYMENT", items })
    txMock.order.updateMany.mockResolvedValue({ count: 0 })

    await expect(changeOrderStatus("o1", "CANCELLED")).resolves.toEqual({
      ok: false,
      code: "CONFLICT",
    })
    expect(txMock.item.updateMany).not.toHaveBeenCalled()
  })

  it("returns every reserved unit to the inventory when cancelling", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "PAYMENT_CONFIRMED", items })
    txMock.order.updateMany.mockResolvedValue({ count: 1 })
    txMock.item.updateMany.mockResolvedValue({ count: 1 })

    await expect(changeOrderStatus("o1", "CANCELLED")).resolves.toEqual({
      ok: true,
      status: "CANCELLED",
    })

    expect(txMock.item.updateMany).toHaveBeenCalledTimes(2)
    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { inventory: { increment: 2 } },
    })
    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: "i2" },
      data: { inventory: { increment: 5 } },
    })
  })

  it("never restocks on non-cancelling transitions such as SHIPPED -> DELIVERED", async () => {
    txMock.order.findUnique.mockResolvedValue({ status: "SHIPPED", items })
    txMock.order.updateMany.mockResolvedValue({ count: 1 })

    await changeOrderStatus("o1", "DELIVERED")

    expect(txMock.item.updateMany).not.toHaveBeenCalled()
  })

  it("does everything inside a single transaction", async () => {
    txMock.order.findUnique.mockResolvedValue(null)

    await changeOrderStatus("o1", "CANCELLED")

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled()
  })
})
