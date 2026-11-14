// Client-safe public API of the orders module (pure domain helpers, DTO types, status badge).
// Persistence, server actions and the admin views are exposed through ./server.ts.
export { MAX_QUANTITY_PER_ITEM, roundMoney } from "./domain/pricing"
export type { OrderLineSnapshot } from "./domain/pricing"
export { formatOrderNumber, isOrderNumber } from "./domain/order-number"
export { formatOrderMoney, formatOrderDate } from "./domain/format"
export {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  allowedTransitions,
  canTransition,
  isOrderStatus,
} from "./domain/status"
export type { OrderStatus } from "./domain/status"
export { ORDER_CURRENCY } from "./types"
export type {
  OrderSummary,
  OrderDetail,
  OrderConfirmation,
  UserOrderSummary,
  CheckoutDefaults,
  PlaceOrderInput,
  PlacedOrder,
} from "./types"
export { OrderStatusBadge } from "./components/order-status-badge"
