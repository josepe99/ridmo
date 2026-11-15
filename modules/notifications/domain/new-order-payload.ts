import { isDomesticShipment } from "@/modules/orders"
import { formatMoney } from "@/shared/lib/currency"

/** Minimal order data needed to notify admins. */
export type NewOrderNotificationInput = {
  id: string
  orderNumber: string
  total: number
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
  const base = `${order.orderNumber} · ${formatMoney(order.total, order.currency)}`
  const abroad = order.shippingCountry && !isDomesticShipment(order.shippingCountry)

  return {
    title: "Nuevo pedido",
    body: abroad ? `${base} · Envío a ${order.shippingCountry}` : base,
    url: `/admin/orders/${order.id}`,
    tag: `order-${order.orderNumber}`,
  }
}
