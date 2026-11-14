import "server-only"

// Server-only public API of the orders module: persistence, queries and server actions.
// Pure helpers, DTO types and the status badge live in ./index.ts.
export { placeOrder } from "./services/place-order"
export type { PlaceOrderResult } from "./services/place-order"
export { listOrders, getOrderDetail, getOrderConfirmation } from "./services/order-queries"
export { changeOrderStatus } from "./services/change-order-status"
export { updateOrderStatusAction } from "./actions/update-order-status.action"
export type { UpdateOrderStatusResult } from "./actions/update-order-status.action"

// Admin views (server components). They call the admin-only server action, so they live here.
export { OrdersTable } from "./components/orders-table"
export { OrderDetailView } from "./components/order-detail-view"

// Customer-facing queries scoped to the signed-in user (profile page, checkout prefill).
export { listOrdersForUser, getCheckoutDefaults } from "./services/user-orders"
