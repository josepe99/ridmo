import { listOrders, OrdersTable } from "@/modules/orders/server"
import { requireAdmin } from "@/modules/users/server"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  await requireAdmin()
  const orders = await listOrders()

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-neutral-500">Admin</p>
        <h1 className="mt-1 font-serif text-3xl tracking-display text-neutral-900 sm:text-4xl">Pedidos</h1>
        <p className="mt-2 text-sm text-neutral-500">Del más reciente al más antiguo.</p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
