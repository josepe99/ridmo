/**
 * Order lifecycle. Kept as plain strings (mirroring the Prisma enum) so this file
 * stays importable from client components without pulling @prisma/client.
 */
export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value)
}

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
}

/** Statuses an order can move to from `from`. */
export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Spanish labels shown in the admin UI and the customer confirmation page. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAYMENT_CONFIRMED: "Pago confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}
