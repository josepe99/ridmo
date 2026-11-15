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
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Pedidos, del más reciente al más antiguo</caption>
        <thead>
          <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-eyebrow text-neutral-500">
            <th scope="col" className="px-4 py-3 font-semibold">Pedido</th>
            <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
            <th scope="col" className="px-4 py-3 font-semibold">País</th>
            <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-neutral-100 transition-colors duration-200 last:border-b-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-4">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-xs text-neutral-500">
                  {order.itemCount} {order.itemCount === 1 ? "unidad" : "unidades"}
                </p>
              </td>
              <td className="px-4 py-4 text-neutral-700">{order.customerName}</td>
              <td className="px-4 py-4 text-neutral-700">{order.shippingCountry}</td>
              <td className="px-4 py-4 whitespace-nowrap text-neutral-500">{formatOrderDate(order.createdAt)}</td>
              <td className="px-4 py-4">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-4 text-right font-medium whitespace-nowrap text-neutral-900">
                {formatOrderMoney(order.total, order.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
