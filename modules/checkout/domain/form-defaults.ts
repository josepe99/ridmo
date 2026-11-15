import { DOMESTIC_COUNTRY, isShippingCountry, type CheckoutDefaults } from "@/modules/orders"
import type { CheckoutFormValues } from "../schemas/checkout.schema"

/** A saved country is reused only while it is still an allowed destination; otherwise Paraguay. */
function resolveCountry(saved: string | undefined): string {
  return isShippingCountry(saved) ? saved : DOMESTIC_COUNTRY
}

/** Initial form values: empty for guests, prefilled contact and address for signed-in customers. */
export function buildFormDefaults(defaults?: CheckoutDefaults): CheckoutFormValues {
  return {
    customer: {
      fullName: defaults?.customer?.fullName ?? "",
      phone: defaults?.customer?.phone ?? "",
      email: defaults?.customer?.email ?? "",
    },
    shippingAddress: {
      street: defaults?.shippingAddress?.street ?? "",
      reference: defaults?.shippingAddress?.reference ?? "",
      city: defaults?.shippingAddress?.city ?? "",
      department: defaults?.shippingAddress?.department ?? "",
      country: resolveCountry(defaults?.shippingAddress?.country),
      postalCode: defaults?.shippingAddress?.postalCode ?? "",
      notes: defaults?.shippingAddress?.notes ?? "",
    },
  }
}
