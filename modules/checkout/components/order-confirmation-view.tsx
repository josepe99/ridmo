import Image from "next/image"
import Link from "next/link"
import {
  InternationalShippingNotice,
  OrderStatusBadge,
  formatOrderMoney,
  type OrderConfirmation,
} from "@/modules/orders"
import type { BankTransferDetails } from "../services/bank-details"
import { BankTransferDetailsList } from "./bank-transfer-details"
import { EYEBROW } from "./step-heading"

type Props = {
  order: OrderConfirmation
  bank: BankTransferDetails
  /** Business WhatsApp number (digits); when set, a "send proof" link is shown. */
  whatsappNumber?: string
}

export function OrderConfirmationView({ order, bank, whatsappNumber }: Props) {
  const firstName = order.customerName.split(" ")[0]
  const proofMessage = `Hola! Te envío el comprobante de mi pedido ${order.orderNumber}.`
  const whatsappDigits = whatsappNumber?.replace(/\D/g, "") ?? ""

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-24">
      <header className="text-center">
        <p className={EYEBROW}>Pedido registrado</p>
        <h1 className="mt-4 font-serif text-4xl tracking-display text-neutral-900 md:text-6xl">
          Gracias, {firstName}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-neutral-500">
          Tu pedido <strong className="font-medium text-neutral-900">{order.orderNumber}</strong> está reservado.
          Para confirmarlo, realizá la transferencia y envianos el comprobante.
        </p>
        <div className="mt-6 flex justify-center">
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      {/* Bank transfer instructions */}
      <section aria-labelledby="transfer-heading" className="mt-16 border border-black p-6 md:p-10">
        <h2 id="transfer-heading" className="font-serif text-2xl tracking-display text-neutral-900 md:text-3xl">
          Transferencia bancaria
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Transferí exactamente{" "}
          <strong className="font-medium text-neutral-900">{formatOrderMoney(order.total, order.currency)}</strong>{" "}
          e indicá el número <strong className="font-medium text-neutral-900">{order.orderNumber}</strong> como
          concepto.
        </p>

        <BankTransferDetailsList bank={bank} />
      </section>

      {/* Next steps */}
      <section aria-labelledby="steps-heading" className="mt-16">
        <h2 id="steps-heading" className={EYEBROW}>
          Qué sigue
        </h2>
        <ol className="mt-6 space-y-5 text-sm leading-7 text-neutral-700">
          <li className="flex gap-4">
            <span className="font-serif text-xl text-neutral-900">1</span>
            <span>Realizá la transferencia por el monto indicado.</span>
          </li>
          <li className="flex gap-4">
            <span className="font-serif text-xl text-neutral-900">2</span>
            <span>
              Enviá el comprobante junto con tu número de pedido por WhatsApp o Instagram, los mismos canales de
              contacto de nuestra tienda.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="font-serif text-xl text-neutral-900">3</span>
            <span>Confirmaremos tu pago y coordinaremos el envío con vos.</span>
          </li>
        </ol>
        <div className="mt-8">
          <InternationalShippingNotice country={order.shippingCountry} showCountry />
        </div>
        {whatsappDigits ? (
          <a
            href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(proofMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block border border-black px-8 py-4 text-xs font-semibold uppercase tracking-label text-black transition-colors duration-200 hover:bg-black hover:text-white"
          >
            Enviar comprobante por WhatsApp
          </a>
        ) : null}
      </section>

      {/* Summary */}
      <section aria-labelledby="summary-heading" className="mt-16">
        <h2 id="summary-heading" className={EYEBROW}>
          Resumen del pedido
        </h2>
        <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {order.items.map((line) => (
            <li key={line.itemId} className="flex items-center gap-4 py-5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                <Image
                  src={line.image || "/placeholder.svg"}
                  alt={line.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg leading-snug text-neutral-900">{line.name}</p>
                <p className="text-xs text-neutral-500">
                  {line.quantity} × {formatOrderMoney(line.unitPrice, order.currency)}
                </p>
              </div>
              <p className="whitespace-nowrap text-sm font-medium text-neutral-900">
                {formatOrderMoney(line.lineTotal, order.currency)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-baseline justify-between">
          <span className={EYEBROW}>Total</span>
          <span className="font-serif text-3xl text-neutral-900">{formatOrderMoney(order.total, order.currency)}</span>
        </div>
      </section>

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="text-xs uppercase tracking-label text-neutral-500 underline-offset-4 transition-colors duration-200 hover:text-black hover:underline"
        >
          Volver a la tienda
        </Link>
      </div>
    </article>
  )
}
