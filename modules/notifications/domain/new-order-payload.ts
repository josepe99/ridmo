import { isDomesticShipment } from "@/modules/orders"
import { formatMoney } from "@/shared/lib/currency"

/** Minimal order data needed to notify admins. */
export type NewOrderNotificationInput = {
  id: string
  orderNumber: string
  /** Final amount, shipping included. */
  total: number
  /** Shipping already included in `total`; omitted or 0 when none was charged. */
  shippingCost?: number
  currency: string
  /** Destination country name; only mentioned in the notification when it is not Paraguay. */
  shippingCountry?: string
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
  const shipping =
    order.shippingCost && order.shippingCost > 0
      ? ` (envío ${formatMoney(order.shippingCost, order.currency)} incl.)`
      : ""
  const base = `${order.orderNumber} · ${formatMoney(order.total, order.currency)}${shipping}`
  const abroad = order.shippingCountry && !isDomesticShipment(order.shippingCountry)

  return {
    title: "Nuevo pedido",
    body: abroad ? `${base} · Envío a ${order.shippingCountry}` : base,
    url: `/admin/orders/${order.id}`,
    tag: `order-${order.orderNumber}`,
  }
}
