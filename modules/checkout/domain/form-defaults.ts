import {
  DOMESTIC_COUNTRY,
  getShippingOption,
  isShippingCountry,
  type CheckoutDefaults,
} from "@/modules/orders"
import type { CheckoutFormValues } from "../schemas/checkout.schema"

/** A saved country is reused only while it is still an allowed destination; otherwise Paraguay. */
function resolveCountry(saved: string | undefined): string {
  return isShippingCountry(saved) ? saved : DOMESTIC_COUNTRY
}

/** A saved shipping option is reused only when the saved address was in Paraguay and it still exists. */
function resolveShippingOptionId(savedCountry: string | undefined, savedOptionId: string | undefined): string {
  return savedCountry === DOMESTIC_COUNTRY && getShippingOption(savedOptionId) ? (savedOptionId as string) : ""
}

/** Initial form values: empty for guests, prefilled contact and address for signed-in customers. */
export function buildFormDefaults(defaults?: CheckoutDefaults): CheckoutFormValues {
  const country = resolveCountry(defaults?.shippingAddress?.country)
  const shippingOptionId = resolveShippingOptionId(
    defaults?.shippingAddress?.country,
    defaults?.shippingAddress?.shippingOptionId
  )
  // A city option fixes the city; the saved free-text one is only kept for interior deliveries.
  const city = getShippingOption(shippingOptionId)?.city ?? defaults?.shippingAddress?.city ?? ""

  return {
    customer: {
      fullName: defaults?.customer?.fullName ?? "",
      phone: defaults?.customer?.phone ?? "",
      email: defaults?.customer?.email ?? "",
    },
    shippingAddress: {
      street: defaults?.shippingAddress?.street ?? "",
      reference: defaults?.shippingAddress?.reference ?? "",
      city,
      department: defaults?.shippingAddress?.department ?? "",
      country,
      shippingOptionId,
      postalCode: defaults?.shippingAddress?.postalCode ?? "",
      notes: defaults?.shippingAddress?.notes ?? "",
    },
  }
}
