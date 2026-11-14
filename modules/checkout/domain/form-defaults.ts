import type { CheckoutDefaults } from "@/modules/orders"
import type { CheckoutFormValues } from "../schemas/checkout.schema"

/** The store ships inside Paraguay only: the country is fixed, never chosen by the shopper. */
export const SHIPPING_COUNTRY = "Paraguay"

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
      country: SHIPPING_COUNTRY,
      notes: defaults?.shippingAddress?.notes ?? "",
    },
  }
}
