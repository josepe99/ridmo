import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import type { CartItem } from "@/modules/cart"
import { MAX_QUANTITY_PER_ITEM } from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"
import { StepActions } from "./step-actions"
import { EYEBROW, StepHeading } from "./step-heading"

type CartItemsStepProps = {
  items: ReadonlyArray<CartItem>
  subtotal: number
  /** Per-line server errors keyed by item id (e.g. not enough stock). */
  lineErrors?: Record<string, string>
  /** Step-level message (e.g. a stock or price problem reported by the server). */
  message?: string | null
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onContinue: () => void
  /** Compact order summary shown above the primary button on small screens. */
  summary?: ReactNode
}

const ACTION_LINK =
  "underline-offset-4 transition-colors duration-200 hover:text-black hover:underline focus-visible:text-black focus-visible:underline"

/** Step 1: review the products, change quantities, remove or clear. */
export function CartItemsStep({
  items,
  subtotal,
  lineErrors = {},
  message,
  onQuantityChange,
  onRemove,
  onClear,
  onContinue,
  summary,
}: CartItemsStepProps) {
  return (
    <section>
      <StepHeading step="items" title="Tu selección" />

      {message ? (
        <p role="alert" className="mb-8 border-l-2 border-black pl-3 text-sm font-medium text-neutral-900">
          {message}
        </p>
      ) : null}

      <ul aria-label="Productos en tu carrito" className="divide-y divide-neutral-200">
        {items.map((item) => (
          <li key={item.id} className="py-6 first:pt-0">
            <div className="flex gap-4 sm:gap-6">
              <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-neutral-100 sm:w-28">
                <Image src={item.image || "/placeholder.svg"} alt="" fill sizes="112px" className="object-cover" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                {/* Mobile first: the name takes the full width and both prices share the row below it;
                    from sm up the line total moves beside the name. */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1">
                  <h3 className="col-span-2 row-start-1 min-w-0 font-serif text-lg leading-snug text-neutral-900 sm:col-span-1 md:text-xl">
                    {item.name}
                  </h3>
                  <p className="col-start-1 row-start-2 whitespace-nowrap text-sm text-neutral-500">
                    {formatGuaranies(item.price)}
                  </p>
                  <p className="col-start-2 row-start-2 whitespace-nowrap text-sm font-medium text-neutral-900 sm:row-start-1">
                    {formatGuaranies(item.price * item.quantity)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center border border-neutral-300">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                      className="flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors duration-200 hover:bg-neutral-100"
                      aria-label={`Quitar una unidad de ${item.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= MAX_QUANTITY_PER_ITEM}
                      className="flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Agregar una unidad de ${item.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Quitar ${item.name} del carrito`}
                    className={`text-xs uppercase tracking-label text-neutral-500 ${ACTION_LINK}`}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
            {lineErrors[item.id] ? (
              <p role="alert" className="mt-3 border-l-2 border-black pl-3 text-sm font-medium text-neutral-900">
                {lineErrors[item.id]}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-label text-neutral-500">
        <Link href="/" className={ACTION_LINK}>
          Seguir comprando
        </Link>
        <button type="button" onClick={onClear} className={ACTION_LINK}>
          Vaciar carrito
        </button>
      </div>

      <div className="mt-10 flex items-baseline justify-between border-t border-neutral-200 pt-6">
        <span className={EYEBROW}>Subtotal</span>
        <span className="font-serif text-2xl text-neutral-900">{formatGuaranies(subtotal)}</span>
      </div>

      <StepActions summary={summary} primaryLabel="Continuar" onPrimary={onContinue} />
    </section>
  )
}
