import "server-only"

import { prisma } from "@/shared/lib/prisma"
import { isOrderNumber } from "../domain/order-number"
import { isOrderStatus, type OrderStatus } from "../domain/status"
import type { OrderConfirmation, OrderDetail, OrderSummary } from "../types"

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

function toStatus(value: string): OrderStatus {
  if (!isOrderStatus(value)) throw new Error(`Unknown order status: ${value}`)
  return value
}

/** Orders for the admin list, newest first. */
export async function listOrders(limit = 100): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      currency: true,
      createdAt: true,
      customer: { select: { fullName: true } },
      shippingAddress: { select: { country: true } },
      items: { select: { quantity: true } },
    },
  })

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: toStatus(order.status),
    total: order.total,
    currency: order.currency,
    customerName: order.customer.fullName,
    shippingCountry: order.shippingAddress.country,
    itemCount: order.items.reduce((sum, line) => sum + line.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  }))
}

/** Full order for the admin detail page, or null when the id is unknown. */
export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  if (!OBJECT_ID_PATTERN.test(id)) return null

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return null

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: toStatus(order.status),
    paymentMethod: "TRANSFER",
    subtotal: order.subtotal,
    total: order.total,
    currency: order.currency,
    customerName: order.customer.fullName,
    shippingCountry: order.shippingAddress.country,
    itemCount: order.items.reduce((sum, line) => sum + line.quantity, 0),
    customer: {
      fullName: order.customer.fullName,
      phone: order.customer.phone,
      email: order.customer.email ?? null,
    },
    shippingAddress: {
      street: order.shippingAddress.street,
      reference: order.shippingAddress.reference,
      city: order.shippingAddress.city,
      department: order.shippingAddress.department,
      country: order.shippingAddress.country,
      postalCode: order.shippingAddress.postalCode ?? null,
      notes: order.shippingAddress.notes ?? null,
    },
    items: order.items.map((line) => ({
      itemId: line.itemId,
      name: line.name,
      slug: line.slug,
      image: line.image ?? null,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    displayCountry: order.displayCountry ?? null,
    displayCurrency: order.displayCurrency ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

/**
 * Order for the public confirmation page. The order number alone is guessable
 * (sequential), so the secret access token issued at checkout is required too.
 */
export async function getOrderConfirmation(
  orderNumber: string,
  accessToken: string
): Promise<OrderConfirmation | null> {
  if (!isOrderNumber(orderNumber) || accessToken.length < 16 || accessToken.length > 128) {
    return null
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, publicToken: accessToken },
    select: {
      orderNumber: true,
      status: true,
      currency: true,
      subtotal: true,
      total: true,
      createdAt: true,
      customer: { select: { fullName: true } },
      shippingAddress: { select: { country: true } },
      items: true,
    },
  })
  if (!order) return null

  return {
    shippingCountry: order.shippingAddress.country,
    orderNumber: order.orderNumber,
    status: toStatus(order.status),
    currency: order.currency,
    subtotal: order.subtotal,
    total: order.total,
    customerName: order.customer.fullName,
    items: order.items.map((line) => ({
      itemId: line.itemId,
      name: line.name,
      slug: line.slug,
      image: line.image ?? null,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    createdAt: order.createdAt.toISOString(),
  }
}
