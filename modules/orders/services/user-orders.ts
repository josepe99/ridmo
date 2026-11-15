import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { isOrderStatus, type OrderStatus } from "../domain/status"
import type { CheckoutDefaults, UserOrderSummary } from "../types"

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i
const MAX_LIST = 100

function toStatus(value: string): OrderStatus {
  if (!isOrderStatus(value)) throw new Error(`Unknown order status: ${value}`)
  return value
}

/**
 * The signed-in customer's own orders, newest first.
 *
 * Authorization boundary (no IDOR): the owner id is ALWAYS part of the query filter and comes
 * from the caller's session, never from a URL or form field. Rows are additionally checked
 * against the owner before mapping. The summary has no contact data, address or access token.
 */
export async function listOrdersForUser(userId: string, limit = 50): Promise<UserOrderSummary[]> {
  if (!OBJECT_ID_PATTERN.test(userId)) return []

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(1, Math.floor(limit) || 1), MAX_LIST),
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      status: true,
      total: true,
      currency: true,
      createdAt: true,
      items: { select: { quantity: true } },
    },
  })

  return orders
    .filter((order) => order.userId === userId)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: toStatus(order.status),
      total: order.total,
      currency: order.currency,
      itemCount: order.items.reduce((sum, line) => sum + line.quantity, 0),
      createdAt: order.createdAt.toISOString(),
    }))
}

/**
 * Checkout prefill for a signed-in customer: the contact and address of their latest order,
 * or just their account name and email when they have not ordered yet.
 */
export async function getCheckoutDefaults(user: {
  id: string
  name: string | null
  email: string
}): Promise<CheckoutDefaults> {
  const latest = OBJECT_ID_PATTERN.test(user.id)
    ? await prisma.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { customer: true, shippingAddress: true },
      })
    : null

  if (!latest) {
    return { customer: { fullName: user.name ?? "", phone: "", email: user.email } }
  }

  return {
    customer: {
      fullName: latest.customer.fullName,
      phone: latest.customer.phone,
      email: latest.customer.email ?? user.email,
    },
    shippingAddress: {
      street: latest.shippingAddress.street,
      reference: latest.shippingAddress.reference,
      city: latest.shippingAddress.city,
      department: latest.shippingAddress.department,
      country: latest.shippingAddress.country,
      shippingOptionId: latest.shippingAddress.shippingOptionId ?? "",
      postalCode: latest.shippingAddress.postalCode ?? "",
      notes: latest.shippingAddress.notes ?? "",
    },
  }
}
