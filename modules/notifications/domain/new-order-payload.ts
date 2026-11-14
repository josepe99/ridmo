import { formatMoney } from "@/shared/lib/currency"

/** Minimal order data needed to notify admins. */
export type NewOrderNotificationInput = {
  id: string
  orderNumber: string
  total: number
  currency: string
}

/** JSON body delivered to the service worker's `push` handler (see public/sw.js). */
export type PushPayload = {
  title: string
  body: string
  /** Same-origin path opened when the notification is clicked. */
  url: string
  /** Notifications sharing a tag replace each other. */
  tag: string
}

export function buildNewOrderPayload(order: NewOrderNotificationInput): PushPayload {
  return {
    title: "Nuevo pedido",
    body: `${order.orderNumber} · ${formatMoney(order.total, order.currency)}`,
    url: `/admin/orders/${order.id}`,
    tag: `order-${order.orderNumber}`,
  }
}
