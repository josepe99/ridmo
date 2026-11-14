import Link from "next/link"
import { notFound } from "next/navigation"
import { getOrderDetail, OrderDetailView } from "@/modules/orders/server"
import { requireAdmin } from "@/modules/users/server"

export const dynamic = "force-dynamic"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const order = await getOrderDetail(id)
  if (!order) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/admin/orders"
        className="mb-6 inline-block text-xs uppercase tracking-label text-neutral-500 underline-offset-4 transition-colors duration-200 hover:text-black hover:underline"
      >
        &larr; Todos los pedidos
      </Link>
      <OrderDetailView order={order} />
    </div>
  )
}
