import Image from "next/image"
import { formatOrderDate, formatOrderMoney } from "../domain/format"
import { isDomesticShipment } from "../domain/shipping-countries"
import type { OrderDetail } from "../types"
import { InternationalShippingNotice } from "./international-shipping-notice"
import { MapLocationLink } from "./map-location-link"
import { OrderStatusActions } from "./order-status-actions"
import { OrderStatusBadge } from "./order-status-badge"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const { customer, shippingAddress } = order
  // International and legacy orders carry no priced option: their shipping is coordinated afterwards.
  // Written address lines that exist: map orders and optional fields leave some of them empty.
  const cityLine = [shippingAddress.city, shippingAddress.department].filter(Boolean).join(", ")
  const hasShippingCharge = Boolean(shippingAddress.shippingOptionLabel) && isDomesticShipment(shippingAddress.country)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Pedido</p>
          <h1 className="mt-1 break-words font-serif text-3xl tracking-display text-neutral-900 sm:text-4xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-neutral-500">{formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="self-start sm:self-auto" />
      </header>

      <Section title="Cambiar estado">
        <OrderStatusActions orderId={order.id} status={order.status} />
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Cliente">
          <dl className="space-y-1 break-words text-sm text-neutral-700">
            <dd className="text-base font-medium text-neutral-900">{customer.fullName}</dd>
            <dd>
              <a href={`tel:${customer.phone}`} className="inline-flex min-h-10 items-center underline underline-offset-4">
                {customer.phone}
              </a>
            </dd>
            {customer.email ? (
              <dd>
                <a href={`mailto:${customer.email}`} className="inline-flex min-h-10 items-center break-all underline underline-offset-4">
                  {customer.email}
                </a>
              </dd>
            ) : null}
          </dl>
        </Section>

        <Section title="Envío">
          <address className="space-y-1 break-words text-sm not-italic text-neutral-700">
            <p className="text-base font-medium text-neutral-900">{shippingAddress.street}</p>
            {shippingAddress.reference ? <p>{shippingAddress.reference}</p> : null}
            <p>{cityLine}</p>
            {shippingAddress.postalCode ? <p>Código postal: {shippingAddress.postalCode}</p> : null}
            <p>{shippingAddress.country}</p>
            <MapLocationLink
              latitude={shippingAddress.latitude}
              longitude={shippingAddress.longitude}
              className="block text-neutral-900"
            />
            {shippingAddress.notes ? (
              <p className="pt-2 text-neutral-500">Notas: {shippingAddress.notes}</p>
            ) : null}
          </address>
          <div className="mt-4">
            <InternationalShippingNotice country={shippingAddress.country} audience="admin" />
          </div>
        </Section>
      </div>

      <Section title="Productos">
        <ul className="divide-y divide-neutral-100">
          {order.items.map((line) => (
            <li key={line.itemId} className="flex items-center gap-3 py-4 sm:gap-4 first:pt-0 last:pb-0">
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
                <p className="line-clamp-2 break-words text-sm font-medium text-neutral-900">{line.name}</p>
                <p className="text-xs text-neutral-500">
                  {line.quantity} × {formatOrderMoney(line.unitPrice, order.currency)}
                </p>
              </div>
              <p className="text-sm font-medium whitespace-nowrap text-neutral-900">
                {formatOrderMoney(line.lineTotal, order.currency)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd className="text-neutral-900">{formatOrderMoney(order.subtotal, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">
              Envío
              {hasShippingCharge ? <span className="block text-xs">{shippingAddress.shippingOptionLabel}</span> : null}
            </dt>
            <dd className="text-neutral-900">
              {hasShippingCharge ? formatOrderMoney(order.shippingCost, order.currency) : "A coordinar"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pt-1">
            <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Total</dt>
            <dd className="font-serif text-2xl text-neutral-900 sm:text-3xl">{formatOrderMoney(order.total, order.currency)}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Pago">
        <p className="text-sm text-neutral-700">Transferencia bancaria</p>
        {order.displayCurrency && order.displayCurrency !== order.currency ? (
          <p className="mt-2 text-xs text-neutral-500">
            El cliente veía precios en {order.displayCurrency} ({order.displayCountry}). El pedido se registró en{" "}
            {order.currency}.
          </p>
        ) : null}
      </Section>
    </div>
  )
}
