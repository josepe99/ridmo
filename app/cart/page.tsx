import type { Metadata } from "next"
import { CheckoutFlow } from "@/modules/checkout"
import { getBankTransferDetails } from "@/modules/checkout/server"
import { getCheckoutDefaults } from "@/modules/orders/server"
import { getCurrentUser } from "@/modules/users/server"

export const metadata: Metadata = {
  title: "Tu bolsa | RIDMO",
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  // Signed-in customers get their contact data prefilled; guests (or any failure) get the empty form.
  const user = await getCurrentUser().catch(() => null)
  const defaults = user ? await getCheckoutDefaults(user).catch(() => undefined) : undefined

  // Bank details are read on the server (env) and only reach the browser as props for the payment step.
  return <CheckoutFlow defaults={defaults} bank={getBankTransferDetails()} />
}
