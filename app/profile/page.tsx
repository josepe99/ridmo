import type { Metadata } from "next"
import Link from "next/link"
import { ORDER_STATUS_LABELS, formatOrderDate, formatOrderMoney } from "@/modules/orders"
import { listOrdersForUser } from "@/modules/orders/server"
import { ROLE_LABELS } from "@/modules/users"
import { requireUserPage } from "@/modules/users/server"

export const metadata: Metadata = {
  title: "Mi cuenta | RIDMO",
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  // The proxy only checks that a session exists; the user (and their orders) come from the database.
  const user = await requireUserPage("/profile")
  // Authorization by ownership: the id comes from the session, never from the URL.
  const orders = await listOrdersForUser(user.id)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 md:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Mi cuenta</p>
      <h1 className="mt-3 mb-10 font-serif text-4xl tracking-display text-neutral-900 md:text-5xl">
        {user.name ? `Hola, ${user.name}` : "Tu cuenta"}
      </h1>

      <section aria-labelledby="account-heading" className="mb-16">
        <h2 id="account-heading" className="mb-4 border-b border-neutral-200 pb-4 font-serif text-2xl text-neutral-900">
          Datos de la cuenta
        </h2>
        <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Correo electrónico</dt>
            <dd className="mt-1 break-all text-neutral-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Nombre</dt>
            <dd className="mt-1 text-neutral-900">{user.name ?? "Sin nombre"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Tipo de cuenta</dt>
            <dd className="mt-1 text-neutral-900">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="mb-4 border-b border-neutral-200 pb-4 font-serif text-2xl text-neutral-900">
          Mis pedidos
        </h2>

        {orders.length === 0 ? (
          <p className="py-10 text-sm text-neutral-500">
            Todavía no hiciste ningún pedido.{" "}
            <Link href="/" className="underline underline-offset-4">
              Ver la colección
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5">
                <div>
                  <p className="font-medium text-neutral-900">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">
                    {formatOrderDate(order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-900">{formatOrderMoney(order.total, order.currency)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
