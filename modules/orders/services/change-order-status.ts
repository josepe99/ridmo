import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { canTransition, isOrderStatus, type OrderStatus } from "../domain/status"

export type ChangeStatusResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; code: "NOT_FOUND" | "INVALID_TRANSITION" | "CONFLICT" }

/**
 * Moves an order to a new status following the lifecycle rules.
 *
 * Cancelling returns the reserved units to the catalog inventory in the same
 * transaction. The update is conditioned on the status that was read, so two
 * admins acting at once cannot restock twice.
 */
export async function changeOrderStatus(
  orderId: string,
  next: OrderStatus
): Promise<ChangeStatusResult> {
  return prisma.$transaction(async (tx): Promise<ChangeStatusResult> => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, items: { select: { itemId: true, quantity: true } } },
    })
    if (!order) return { ok: false, code: "NOT_FOUND" }

    const current = order.status
    if (!isOrderStatus(current) || !canTransition(current, next)) {
      return { ok: false, code: "INVALID_TRANSITION" }
    }

    const updated = await tx.order.updateMany({
      where: { id: orderId, status: current },
      data: { status: next },
    })
    if (updated.count !== 1) return { ok: false, code: "CONFLICT" }

    if (next === "CANCELLED") {
      for (const line of order.items) {
        await tx.item.updateMany({
          where: { id: line.itemId },
          data: { inventory: { increment: line.quantity } },
        })
      }
    }

    return { ok: true, status: next }
  })
}
