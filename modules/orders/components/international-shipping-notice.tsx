import {
  INTERNATIONAL_SHIPPING_ADMIN_NOTICE,
  INTERNATIONAL_SHIPPING_NOTICE,
  isDomesticShipment,
} from "../domain/shipping-countries"

type Props = {
  country: string | null | undefined
  /** Wording: the shopper (default) or the store admin. */
  audience?: "customer" | "admin"
  /** Also print "Envío a <país>" above the notice (for screens that do not show the address). */
  showCountry?: boolean
}

/**
 * Neutral note shown when an order ships outside Paraguay: there is no fee in the app, cost and
 * delivery time are agreed with the customer afterwards. Renders nothing for domestic orders.
 */
export function InternationalShippingNotice({ country, audience = "customer", showCountry }: Props) {
  if (isDomesticShipment(country)) return null

  return (
    <div role="note" className="border-l-2 border-black pl-3 text-sm leading-6 text-neutral-700">
      {showCountry ? <p className="font-medium text-neutral-900">Envío a {country}</p> : null}
      <p>{audience === "admin" ? INTERNATIONAL_SHIPPING_ADMIN_NOTICE : INTERNATIONAL_SHIPPING_NOTICE}</p>
    </div>
  )
}
