import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OrderConfirmationView } from "@/modules/checkout"
import { getBankTransferDetails } from "@/modules/checkout/server"
import { getOrderConfirmation } from "@/modules/orders/server"
import { WHATSAPP_CONTACT_PHONE_NUMBER } from "@/shared/lib/public-settings"

// The URL carries a secret token: keep it out of search engines and Referer headers.
export const metadata: Metadata = {
  title: "Pedido registrado | RIDMO",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type OrderPageProps = {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams])
  if (typeof token !== "string") notFound()

  const order = await getOrderConfirmation(orderNumber, token)
  if (!order) notFound()

  return (
    <OrderConfirmationView
      order={order}
      bank={getBankTransferDetails()}
      whatsappNumber={WHATSAPP_CONTACT_PHONE_NUMBER}
    />
  )
}
