import type { OrderLineSnapshot } from "./domain/pricing"
import type { OrderStatus } from "./domain/status"

/** Currency every order is stored in (the store sells in guaranies only). */
export const ORDER_CURRENCY = "PYG"

/** Row of the admin orders list. */
export type OrderSummary = {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  currency: string
  customerName: string
  itemCount: number
  createdAt: string
}

/** Everything the admin order detail page shows. */
export type OrderDetail = OrderSummary & {
  subtotal: number
  paymentMethod: "TRANSFER"
  customer: { fullName: string; phone: string; email: string | null }
  shippingAddress: {
    street: string
    reference: string
    city: string
    department: string
    country: string
    notes: string | null
  }
  items: OrderLineSnapshot[]
  /** Legacy: set only on orders placed while the storefront could show converted prices. */
  displayCountry: string | null
  displayCurrency: string | null
  updatedAt: string
}

/** Minimal data shown to the customer on the public confirmation page (no contact or address data). */
export type OrderConfirmation = {
  orderNumber: string
  status: OrderStatus
  currency: string
  subtotal: number
  total: number
  customerName: string
  items: OrderLineSnapshot[]
  createdAt: string
}

/** Input of `placeOrder`. Already validated by the caller; contains no prices. */
export type PlaceOrderInput = {
  customer: { fullName: string; phone: string; email?: string }
  shippingAddress: {
    street: string
    reference: string
    city: string
    department: string
    country: string
    notes?: string
  }
  lines: ReadonlyArray<{ itemId: string; quantity: number }>
  /** Owner of the order. Set only by the server from the session; absent for guest checkout. */
  userId?: string
}

export type PlacedOrder = {
  id: string
  orderNumber: string
  /** Secret that unlocks the public confirmation page of this order. */
  accessToken: string
  total: number
  currency: string
}

/** Row of the customer's own order list (/profile). No contact data, address or access token. */
export type UserOrderSummary = {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  currency: string
  itemCount: number
  createdAt: string
}

/** Checkout form values that can be prefilled for a signed-in customer. */
export type CheckoutDefaults = {
  customer?: { fullName: string; phone: string; email: string }
  shippingAddress?: {
    street: string
    reference: string
    city: string
    department: string
    country: string
    notes: string
  }
}
