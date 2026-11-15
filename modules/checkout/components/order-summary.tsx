import { formatGuaranies } from "@/shared/lib/currency"
import { cn } from "@/shared/lib/utils"
import { shippingDisplayTotal, type ShippingDisplay } from "../domain/shipping-display"
import { EYEBROW } from "./step-heading"

type OrderSummaryProps = {
  totalQuantity: number
  /** Subtotal of the cart (items only, no shipping). */
  totalPrice: number
  /** Shipping known so far. Defaults to "to be quoted", the behavior before shipping had a price. */
  shipping?: ShippingDisplay
  /** `full` is the sticky desktop column; `compact` is the one-line version above mobile buttons. */
  variant?: "full" | "compact"
  className?: string
}

const articlesLabel = (count: number) => `${count} ${count === 1 ? "artículo" : "artículos"}`

function shippingLabel(shipping: ShippingDisplay): string {
  switch (shipping.state) {
    case "priced":
      return formatGuaranies(shipping.cost)
    case "unselected":
      return "Elegí una zona"
    case "to-be-quoted":
      return "A coordinar"
  }
}

/** Items count, subtotal, shipping and total, always in guaranies. */
export function OrderSummary({
  totalQuantity,
  totalPrice,
  shipping = { state: "to-be-quoted" },
  variant = "full",
  className,
}: OrderSummaryProps) {
  const subtotal = formatGuaranies(totalPrice)
  const total = formatGuaranies(shippingDisplayTotal(totalPrice, shipping))

  if (variant === "compact") {
    return (
      <div className={cn("flex items-baseline justify-between border-y border-neutral-200 py-4", className)}>
        <span className="text-sm text-neutral-500">{articlesLabel(totalQuantity)}</span>
        <span className="text-sm text-neutral-900">
          <span className={cn(EYEBROW, "mr-3")}>Total</span>
          <span className="font-serif text-xl">{total}</span>
        </span>
      </div>
    )
  }

  return (
    <div className={cn("border border-neutral-200 p-6 md:p-8", className)}>
      <h2 className={EYEBROW}>Resumen</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">{articlesLabel(totalQuantity)}</dt>
          <dd className="text-neutral-900">{subtotal}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Subtotal</dt>
          <dd className="text-neutral-900">{subtotal}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Envío</dt>
          <dd className="text-neutral-900">{shippingLabel(shipping)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex items-baseline justify-between border-t border-neutral-200 pt-6">
        <span className={EYEBROW}>Total</span>
        <span className="font-serif text-3xl text-neutral-900">{total}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">
        Todos los precios están en guaraníes (Gs.). El monto final se confirma al registrar el pedido.
      </p>
    </div>
  )
}
