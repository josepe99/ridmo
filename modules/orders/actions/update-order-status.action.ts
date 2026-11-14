"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/modules/users/server"
import { isOrderStatus } from "../domain/status"
import { changeOrderStatus, type ChangeStatusResult } from "../services/change-order-status"

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

export type UpdateOrderStatusResult = ChangeStatusResult | { ok: false; code: "INVALID_INPUT" }

/** Admin-only: moves an order to a new status. */
export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<UpdateOrderStatusResult> {
  await requireAdmin()

  if (!OBJECT_ID_PATTERN.test(orderId) || !isOrderStatus(status)) {
    return { ok: false, code: "INVALID_INPUT" }
  }

  const result = await changeOrderStatus(orderId, status)
  if (result.ok) {
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
  }
  return result
}
