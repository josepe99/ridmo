"use server"

import { after } from "next/server"
import { notifyNewOrder } from "@/modules/notifications/server"
import { placeOrder } from "@/modules/orders/server"
import { getCurrentUser } from "@/modules/users/server"
import { createOrderInputSchema } from "../schemas/checkout.schema"

export type CreateOrderFailureCode =
  | "EMPTY_CART"
  | "INVALID_QUANTITY"
  | "ITEM_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "INVALID_SHIPPING_OPTION"
  | "INTERNAL"

export type CreateOrderFailure = {
  ok: false
  code: CreateOrderFailureCode
  message: string
  itemId?: string
  available?: number
}

export type CreateOrderResult =
  | { ok: true; orderNumber: string; accessToken: string }
  | {
      ok: false
      code: "VALIDATION"
      message: string
      /** Dotted field path (e.g. `customer.fullName`) -> message. */
      fieldErrors: Record<string, string>
    }
  | CreateOrderFailure

const FAILURE_MESSAGES: Record<CreateOrderFailureCode, string> = {
  EMPTY_CART: "Tu carrito está vacío.",
  INVALID_QUANTITY: "La cantidad de uno de tus productos no es válida.",
  ITEM_UNAVAILABLE: "Uno de tus productos ya no está disponible. Quitalo del carrito para continuar.",
  INSUFFICIENT_STOCK: "No hay stock suficiente de uno de tus productos.",
  INVALID_SHIPPING_OPTION: "Elegí una zona de envío válida para continuar.",
  INTERNAL: "No pudimos registrar tu pedido. Intentá de nuevo en unos minutos.",
}

/**
 * Creates an order from the checkout form.
 *
 * The client may only say WHICH items and HOW MANY (plus which shipping option); every
 * price, including the shipping cost, is computed on the server. Admin notification runs after the response is sent and can
 * never fail or delay the order.
 */
export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!(path in fieldErrors)) fieldErrors[path] = issue.message
    }
    return {
      ok: false,
      code: "VALIDATION",
      message: "Revisá los datos ingresados.",
      fieldErrors,
    }
  }

  // The owner comes from the session only; `userId` in the payload is stripped by the schema.
  // A failing session lookup must never block a guest-style checkout.
  let userId: string | undefined
  try {
    userId = (await getCurrentUser())?.id
  } catch {
    userId = undefined
  }

  let result
  try {
    result = await placeOrder(userId ? { ...parsed.data, userId } : parsed.data)
  } catch (error) {
    console.error("[checkout] createOrder failed:", error)
    return { ok: false, code: "INTERNAL", message: FAILURE_MESSAGES.INTERNAL }
  }

  if (!result.ok) {
    const failure: CreateOrderFailure = {
      ok: false,
      code: result.code,
      message: FAILURE_MESSAGES[result.code],
    }
    if ("itemId" in result) failure.itemId = result.itemId
    if (result.code === "INSUFFICIENT_STOCK") {
      failure.available = result.available
      failure.message =
        result.available > 0
          ? `Solo quedan ${result.available} unidades de uno de tus productos.`
          : "Uno de tus productos se agotó. Quitalo del carrito para continuar."
    }
    return failure
  }

  const { order } = result
  const notify = () => notifyNewOrder(order)
  try {
    after(notify)
  } catch {
    // Outside a request scope (should not happen in an action): still fire and forget.
    void notify()
  }

  return { ok: true, orderNumber: order.orderNumber, accessToken: order.accessToken }
}
