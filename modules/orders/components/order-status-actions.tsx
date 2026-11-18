"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/shared/lib/utils"
import { updateOrderStatusAction } from "../actions/update-order-status.action"
import { ORDER_STATUS_LABELS, allowedTransitions, type OrderStatus } from "../domain/status"

const ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: ORDER_STATUS_LABELS.PENDING_PAYMENT,
  PAYMENT_CONFIRMED: "Confirmar pago",
  SHIPPED: "Marcar como enviado",
  DELIVERED: "Marcar como entregado",
  CANCELLED: "Cancelar pedido",
}

const ERROR_MESSAGES = {
  NOT_FOUND: "El pedido ya no existe.",
  INVALID_TRANSITION: "Ese cambio de estado no está permitido.",
  CONFLICT: "El pedido cambió mientras lo editabas. Recargá la página e intentá de nuevo.",
  INVALID_INPUT: "Datos inválidos.",
} as const

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const next = allowedTransitions(status)

  if (next.length === 0) {
    return <p className="text-sm text-neutral-500">Este pedido ya no admite más cambios de estado.</p>
  }

  const change = (target: OrderStatus) => {
    if (
      target === "CANCELLED" &&
      !window.confirm("¿Cancelar este pedido? Las unidades volverán al inventario.")
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, target)
      if (result.ok) {
        router.refresh()
      } else {
        setError(ERROR_MESSAGES[result.code])
      }
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {next.map((target) => (
          <button
            key={target}
            type="button"
            disabled={isPending}
            onClick={() => change(target)}
            className={cn(
              "min-h-11 border px-5 py-3 text-xs max-sm:w-full font-semibold uppercase tracking-label transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
              target === "CANCELLED"
                ? "border-neutral-300 bg-white text-neutral-600 hover:border-black hover:text-black"
                : "border-black bg-black text-white hover:bg-neutral-800"
            )}
          >
            {ACTION_LABELS[target]}
          </button>
        ))}
      </div>
      <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm text-neutral-700">
        {error}
      </p>
    </div>
  )
}
