import { cn } from "@/shared/lib/utils"
import { ORDER_STATUS_LABELS, type OrderStatus } from "../domain/status"

// Strictly monochrome: the state is told apart by weight (outline -> solid), not by hue.
const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border-neutral-300 bg-white text-neutral-600",
  PAYMENT_CONFIRMED: "border-neutral-900 bg-white text-neutral-900",
  SHIPPED: "border-neutral-700 bg-neutral-700 text-white",
  DELIVERED: "border-black bg-black text-white",
  CANCELLED: "border-neutral-200 bg-neutral-100 text-neutral-400 line-through",
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label whitespace-nowrap",
        STATUS_STYLES[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
