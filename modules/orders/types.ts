import type { OrderLineSnapshot } from "./domain/pricing"
import type { OrderStatus } from "./domain/status"

/** Currency every order is stored in (the store sells in guaranies only). */
export const ORDER_CURRENCY = "PYG"

/** Row of the admin orders list. */
export type OrderSummary = {
  id: string
  /** Destination country name, as stored in the order. */
  shippingCountry: string
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
  /** Shipping charged (already included in `total`). 0 for international and legacy orders. */
  shippingCost: number
  paymentMethod: "TRANSFER"
  customer: { fullName: string; phone: string; email: string | null }
  shippingAddress: {
    street: string
    reference: string
    city: string
    department: string
    country: string
    /** Absent in orders placed before international shipping. */
    postalCode: string | null
    notes: string | null
    /** Shipping option chosen at checkout. Null for international and legacy orders. */
    shippingOptionId: string | null
    /** Label of that option as it was shown to the shopper. */
    shippingOptionLabel: string | null
  }
  items: OrderLineSnapshot[]
  /** Legacy: set only on orders placed while the storefront could show converted prices. */
  displayCountry: string | null
  displayCurrency: string | null
  updatedAt: string
}

/** Minimal data shown to the customer on the public confirmation page (no contact or address data). */
export type OrderConfirmation = {
  /** Destination country only (no street or contact data). */
  shippingCountry: string
  orderNumber: string
  status: OrderStatus
  currency: string
  subtotal: number
  /** Shipping charged (already included in `total`). 0 for international and legacy orders. */
  shippingCost: number
  /** Label of the shipping option chosen at checkout. Null when shipping is coordinated afterwards. */
  shippingOptionLabel: string | null
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
    /** Id of the chosen Paraguay shipping option. Required for Paraguay, ignored abroad. Never a price. */
    shippingOptionId?: string
    postalCode?: string
    notes?: string
  }
  lines: ReadonlyArray<{ itemId: string; quantity: number }>
  /** Owner of the order. Set only by the server from the session; absent for guest checkout. */
  userId?: string
}

export type PlacedOrder = {
  id: string
  orderNumber: string
  shippingCountry: string
  /** Secret that unlocks the public confirmation page of this order. */
  accessToken: string
  /** Shipping charged by the server (already included in `total`). */
  shippingCost: number
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
    /** Shipping option of the previous order; only reused while it still exists. */
    shippingOptionId?: string
    postalCode: string
    notes: string
  }
}
