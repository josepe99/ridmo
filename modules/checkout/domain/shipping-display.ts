import { calculateShippingCost, isDomesticShipment } from "@/modules/orders"

/**
 * What the checkout shows for shipping before the order exists. Display only: the server
 * recomputes the real cost from the option id when the order is placed.
 */
export type ShippingDisplay =
  | { state: "unselected" }
  | { state: "priced"; cost: number; label: string }
  | { state: "to-be-quoted" }

export function resolveShippingDisplay(country: string, optionId: string | undefined): ShippingDisplay {
  if (!isDomesticShipment(country)) return { state: "to-be-quoted" }

  const result = calculateShippingCost({ country, optionId })
  if (!result.ok || !result.option) return { state: "unselected" }
  return { state: "priced", cost: result.cost, label: result.option.label }
}

/** Subtotal plus the shipping that is already known (nothing while unselected or to be quoted). */
export function shippingDisplayTotal(subtotal: number, shipping: ShippingDisplay): number {
  return shipping.state === "priced" ? subtotal + shipping.cost : subtotal
}
