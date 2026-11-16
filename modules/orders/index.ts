// Client-safe public API of the orders module (pure domain helpers, DTO types, status badge).
// Persistence, server actions and the admin views are exposed through ./server.ts.
export { MAX_QUANTITY_PER_ITEM, roundMoney } from "./domain/pricing"
export type { OrderLineSnapshot } from "./domain/pricing"
export { formatOrderNumber, isOrderNumber } from "./domain/order-number"
export {
  DOMESTIC_COUNTRY,
  INTERNATIONAL_SHIPPING_ADMIN_NOTICE,
  INTERNATIONAL_SHIPPING_NOTICE,
  SHIPPING_COUNTRIES,
  SHIPPING_COUNTRY_NAMES,
  isDomesticShipment,
  isShippingCountry,
} from "./domain/shipping-countries"
export type { ShippingCountry } from "./domain/shipping-countries"
export {
  CITY_SHIPPING_OPTIONS,
  INTERIOR_SHIPPING_OPTIONS,
  INTERNATIONAL_SHIPPING_ETA,
  SHIPPING_OPTIONS,
  calculateShippingCost,
  getShippingOption,
  getShippingRateRows,
} from "./domain/paraguay-shipping"
export type {
  ShippingCostResult,
  ShippingFailure,
  ShippingOption,
  ShippingRateRow,
} from "./domain/paraguay-shipping"
export {
  DEFAULT_MAP_CENTER,
  MAP_LOCATION_STREET,
  buildMapLocationUrl,
  hasMapLocation,
  roundCoordinate,
} from "./domain/map-location"
export type { MapLocation } from "./domain/map-location"
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
export { InternationalShippingNotice } from "./components/international-shipping-notice"
export { MapLocationLink } from "./components/map-location-link"
