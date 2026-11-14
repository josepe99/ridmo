import Link from "next/link"
import { EYEBROW } from "./step-heading"

/** Shown instead of the checkout steps when there is nothing to buy. */
export function EmptyCart() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center md:px-8 md:py-40">
      <p className={EYEBROW}>Tu bolsa</p>
      <h1 className="mt-4 font-serif text-4xl tracking-display text-neutral-900 md:text-5xl">Tu carrito está vacío</h1>
      <p className="mt-4 max-w-sm text-sm leading-7 text-neutral-500">
        Descubrí nuestras piezas y agregá tus favoritas para continuar con la compra.
      </p>
      <Link
        href="/"
        className="mt-10 border border-black bg-black px-10 py-4 text-xs font-semibold uppercase tracking-label text-white transition-colors duration-200 hover:bg-white hover:text-black"
      >
        Seguir comprando
      </Link>
    </section>
  )
}
