import Link from "next/link"
import { formatOrderDate, formatOrderMoney } from "../domain/format"
import type { OrderSummary } from "../types"
import { OrderStatusBadge } from "./order-status-badge"

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white px-6 py-16 text-center">
        <p className="font-serif text-2xl text-neutral-900">Todavía no hay pedidos</p>
        <p className="mt-2 text-sm text-neutral-500">
          Los pedidos aparecerán aquí apenas un cliente confirme su compra.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-neutral-200 bg-white md:overflow-x-auto">
      {/* Below md the rows reflow into stacked cards (same DOM, CSS only); from md up it is a regular table. */}
      <table className="w-full text-left text-sm max-md:block md:min-w-[720px]">
        <caption className="sr-only">Pedidos, del más reciente al más antiguo</caption>
        <thead className="max-md:sr-only">
          <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-eyebrow text-neutral-500">
            <th scope="col" className="px-4 py-3 font-semibold">Pedido</th>
            <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
            <th scope="col" className="px-4 py-3 font-semibold">País</th>
            <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="max-md:block">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-neutral-100 transition-colors duration-200 last:border-b-0 hover:bg-neutral-50 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-4 max-md:gap-y-1 max-md:px-4 max-md:py-4"
            >
              <td className="px-4 py-4 max-md:order-1 max-md:p-0">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex min-h-10 items-center font-medium text-neutral-900 underline-offset-4 hover:underline md:min-h-0"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-xs text-neutral-500">
                  {order.itemCount} {order.itemCount === 1 ? "unidad" : "unidades"}
                </p>
              </td>
              <td className="px-4 py-4 text-neutral-700 max-md:order-3 max-md:min-w-0 max-md:break-words max-md:p-0">{order.customerName}</td>
              <td className="px-4 py-4 text-neutral-700 max-md:order-5 max-md:p-0 max-md:text-xs max-md:text-neutral-500">{order.shippingCountry}</td>
              <td className="px-4 py-4 whitespace-nowrap text-neutral-500 max-md:order-6 max-md:p-0 max-md:text-right max-md:text-xs">{formatOrderDate(order.createdAt)}</td>
              <td className="px-4 py-4 max-md:order-2 max-md:p-0 max-md:text-right">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-4 text-right font-medium whitespace-nowrap text-neutral-900 max-md:order-4 max-md:p-0">
                {formatOrderMoney(order.total, order.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
