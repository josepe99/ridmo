import "server-only"

import { randomBytes } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/shared/lib/prisma"
import { formatOrderNumber } from "../domain/order-number"
import { priceOrder, type PricingFailure } from "../domain/pricing"
import { ORDER_CURRENCY, type PlaceOrderInput, type PlacedOrder } from "../types"
import { nextSequence } from "./sequence"

export type PlaceOrderResult = { ok: true; order: PlacedOrder } | PricingFailure

const MAX_TRANSACTION_ATTEMPTS = 8

/** Thrown inside the transaction to roll everything back when a stock guard fails. */
class StockConflictError extends Error {
  constructor(readonly itemId: string) {
    super(`Insufficient stock for item ${itemId}`)
  }
}

function isWriteConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
}

/**
 * Creates an order from a validated, price-free request.
 *
 * Integrity rules:
 *  - prices, names and images are loaded from the database and snapshotted;
 *    nothing monetary is ever read from the caller;
 *  - inventory is decremented with a guarded `updateMany` (`inventory >= quantity`)
 *    inside the same transaction that creates the order, so concurrent buyers can
 *    never oversell: the loser gets INSUFFICIENT_STOCK and nothing is written.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const itemIds = [...new Set(input.lines.map((line) => line.itemId))]

  const catalog = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      inventory: true,
      isActive: true,
      deletedAt: true,
    },
  })

  const priced = priceOrder(input.lines, catalog)
  if (!priced.ok) return priced

  // Drawn after the cheap validations so rejected carts do not burn numbers.
  const orderNumber = formatOrderNumber(await nextSequence("order"))
  const accessToken = randomBytes(24).toString("base64url")

  for (let attempt = 1; ; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        for (const line of priced.lines) {
          const reserved = await tx.item.updateMany({
            where: { id: line.itemId, isActive: true, inventory: { gte: line.quantity } },
            data: { inventory: { decrement: line.quantity } },
          })
          if (reserved.count !== 1) throw new StockConflictError(line.itemId)
        }

        return tx.order.create({
          data: {
            orderNumber,
            publicToken: accessToken,
            currency: ORDER_CURRENCY,
            subtotal: priced.subtotal,
            total: priced.total,
            customer: {
              fullName: input.customer.fullName,
              phone: input.customer.phone,
              email: input.customer.email || null,
            },
            shippingAddress: {
              street: input.shippingAddress.street,
              reference: input.shippingAddress.reference,
              city: input.shippingAddress.city,
              department: input.shippingAddress.department,
              country: input.shippingAddress.country,
              postalCode: input.shippingAddress.postalCode || null,
              notes: input.shippingAddress.notes || null,
            },
            items: priced.lines,
            // Guest orders carry no owner at all; signed-in orders carry the session user.
            ...(input.userId ? { userId: input.userId } : {}),
          },
          select: { id: true, orderNumber: true, total: true, currency: true },
        })
      })

      return {
        ok: true,
        order: {
          id: created.id,
          orderNumber: created.orderNumber,
          shippingCountry: input.shippingAddress.country,
          accessToken,
          total: created.total,
          currency: created.currency,
        },
      }
    } catch (error) {
      if (error instanceof StockConflictError) {
        const item = await prisma.item.findUnique({
          where: { id: error.itemId },
          select: { inventory: true },
        })
        return {
          ok: false,
          code: "INSUFFICIENT_STOCK",
          itemId: error.itemId,
          available: Math.max(0, item?.inventory ?? 0),
        }
      }
      // Two buyers touched the same item document at once: the loser simply retries.
      if (isWriteConflict(error) && attempt < MAX_TRANSACTION_ATTEMPTS) {
        // Randomised backoff so colliding buyers stop retrying in lockstep.
        await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40 * attempt))
        continue
      }
      throw error
    }
  }
}
