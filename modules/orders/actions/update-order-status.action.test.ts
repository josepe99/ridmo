import { beforeEach, describe, expect, it, vi } from "vitest"

// The admin gate is thinly mocked at the module boundary; its own behavior is not under test here.
vi.mock("@/modules/users/server", () => ({ requireAdmin: vi.fn(async () => "admin_1") }))
vi.mock("next/cache", async () => await import("@/tests/mocks/next-cache"))
vi.mock("../services/change-order-status", () => ({ changeOrderStatus: vi.fn() }))

import { revalidatePath } from "@/tests/mocks/next-cache"
import { changeOrderStatus } from "../services/change-order-status"
import { updateOrderStatusAction } from "./update-order-status.action"

const OBJECT_ID = "64b7f0a0a0a0a0a0a0a0a0a0"

beforeEach(() => {
  vi.mocked(changeOrderStatus).mockReset()
  revalidatePath.mockReset()
})

describe("updateOrderStatusAction", () => {
  it.each([
    ["a malformed order id", "nope", "SHIPPED"],
    ["an unknown status", OBJECT_ID, "LOST"],
  ])("rejects %s without touching the database", async (_label, orderId, status) => {
    await expect(updateOrderStatusAction(orderId, status)).resolves.toEqual({
      ok: false,
      code: "INVALID_INPUT",
    })
    expect(changeOrderStatus).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("changes the status and revalidates the list and the detail pages", async () => {
    vi.mocked(changeOrderStatus).mockResolvedValue({ ok: true, status: "PAYMENT_CONFIRMED" })

    await expect(updateOrderStatusAction(OBJECT_ID, "PAYMENT_CONFIRMED")).resolves.toEqual({
      ok: true,
      status: "PAYMENT_CONFIRMED",
    })

    expect(changeOrderStatus).toHaveBeenCalledWith(OBJECT_ID, "PAYMENT_CONFIRMED")
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders")
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/orders/${OBJECT_ID}`)
  })

  it.each(["NOT_FOUND", "INVALID_TRANSITION", "CONFLICT"] as const)(
    "passes the %s failure through and does not revalidate",
    async (code) => {
      vi.mocked(changeOrderStatus).mockResolvedValue({ ok: false, code })

      await expect(updateOrderStatusAction(OBJECT_ID, "CANCELLED")).resolves.toEqual({
        ok: false,
        code,
      })
      expect(revalidatePath).not.toHaveBeenCalled()
    }
  )
})
