/** Upper bound of units of a single product per order. */
export const MAX_QUANTITY_PER_ITEM = 20

/** What the client is allowed to say about a cart line: which item and how many. Never a price. */
export type RequestedLine = {
  itemId: string
  quantity: number
}

/** Catalog data needed to price a line. Loaded from the database, never from the client. */
export type CatalogItem = {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  inventory: number
  isActive: boolean
  deletedAt: Date | null
}

/** Immutable snapshot of a purchased item, stored inside the order. */
export type OrderLineSnapshot = {
  itemId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type PricingFailure =
  | { ok: false; code: "EMPTY_CART" }
  | { ok: false; code: "INVALID_QUANTITY"; itemId: string }
  | { ok: false; code: "ITEM_UNAVAILABLE"; itemId: string }
  | { ok: false; code: "INSUFFICIENT_STOCK"; itemId: string; available: number }

export type PricingResult =
  | { ok: true; lines: OrderLineSnapshot[]; subtotal: number; total: number }
  | PricingFailure

/** Rounds to two decimals so float sums never leak noise like 99.99999999. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Prices a cart entirely from catalog data.
 *
 * Only `itemId` and `quantity` are read from the requested lines; any other
 * property a tampered client attaches (price, total...) is ignored on purpose.
 * Duplicated item ids are merged. Pure: no database access.
 */
export function priceOrder(
  requested: ReadonlyArray<RequestedLine>,
  catalog: ReadonlyArray<CatalogItem>
): PricingResult {
  if (requested.length === 0) return { ok: false, code: "EMPTY_CART" }

  const quantities = new Map<string, number>()
  for (const { itemId, quantity } of requested) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, code: "INVALID_QUANTITY", itemId }
    }
    quantities.set(itemId, (quantities.get(itemId) ?? 0) + quantity)
  }

  const byId = new Map(catalog.map((item) => [item.id, item]))
  const lines: OrderLineSnapshot[] = []

  for (const [itemId, quantity] of quantities) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, code: "INVALID_QUANTITY", itemId }
    }

    const item = byId.get(itemId)
    if (!item || !item.isActive || item.deletedAt !== null) {
      return { ok: false, code: "ITEM_UNAVAILABLE", itemId }
    }

    if (item.inventory < quantity) {
      return { ok: false, code: "INSUFFICIENT_STOCK", itemId, available: Math.max(0, item.inventory) }
    }

    lines.push({
      itemId: item.id,
      name: item.name,
      slug: item.slug,
      image: item.images[0] ?? null,
      unitPrice: item.price,
      quantity,
      lineTotal: roundMoney(item.price * quantity),
    })
  }

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  // No shipping, tax or discount rules yet: the total equals the subtotal.
  return { ok: true, lines, subtotal, total: subtotal }
}
