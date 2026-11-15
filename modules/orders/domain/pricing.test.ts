import { describe, expect, it } from "vitest"
import { priceOrder, type CatalogItem } from "./pricing"

const watch: CatalogItem = {
  id: "665f1c2e8b3a4d0012a1b001",
  name: "Reloj Meridian Negro",
  slug: "reloj-meridian-negro",
  price: 6_800_000,
  images: [
    "https://res.cloudinary.com/demo/image/upload/a.jpg",
    "https://res.cloudinary.com/demo/image/upload/b.jpg",
  ],
  inventory: 4,
  isActive: true,
  deletedAt: null,
}

const chain: CatalogItem = {
  id: "665f1c2e8b3a4d0012a1b002",
  name: "Cadena Milan 60 cm",
  slug: "cadena-milan-60",
  price: 3_900_000,
  images: [],
  inventory: 3,
  isActive: true,
  deletedAt: null,
}

describe("priceOrder", () => {
  it("prices every line from the catalog and sums subtotal and total", () => {
    const result = priceOrder(
      [
        { itemId: watch.id, quantity: 2 },
        { itemId: chain.id, quantity: 1 },
      ],
      [watch, chain]
    )

    expect(result).toEqual({
      ok: true,
      lines: [
        {
          itemId: watch.id,
          name: watch.name,
          slug: watch.slug,
          image: watch.images[0],
          unitPrice: 6_800_000,
          quantity: 2,
          lineTotal: 13_600_000,
        },
        {
          itemId: chain.id,
          name: chain.name,
          slug: chain.slug,
          image: null,
          unitPrice: 3_900_000,
          quantity: 1,
          lineTotal: 3_900_000,
        },
      ],
      subtotal: 17_500_000,
      shippingCost: 0,
      total: 17_500_000,
    })
  })

  describe("shipping", () => {
    it("adds the shipping cost on top of the subtotal", () => {
      const result = priceOrder([{ itemId: watch.id, quantity: 2 }], [watch], 20_000)

      expect(result).toMatchObject({ ok: true, subtotal: 13_600_000, shippingCost: 20_000, total: 13_620_000 })
    })

    it("leaves the subtotal and the lines untouched by shipping", () => {
      const free = priceOrder([{ itemId: watch.id, quantity: 1 }], [watch])
      const shipped = priceOrder([{ itemId: watch.id, quantity: 1 }], [watch], 35_000)

      if (!free.ok || !shipped.ok) throw new Error("unreachable")
      expect(shipped.lines).toEqual(free.lines)
      expect(shipped.subtotal).toBe(free.subtotal)
      expect(shipped.total).toBe(free.total + 35_000)
    })

    it("rounds the total to two decimals", () => {
      const odd: CatalogItem = { ...chain, price: 33.333, inventory: 10 }
      const result = priceOrder([{ itemId: odd.id, quantity: 3 }], [odd], 0.1)

      expect(result).toMatchObject({ ok: true, subtotal: 100, shippingCost: 0.1, total: 100.1 })
    })

    it("charges no shipping when none is given (international orders are quoted later)", () => {
      const result = priceOrder([{ itemId: watch.id, quantity: 1 }], [watch])

      expect(result).toMatchObject({ ok: true, shippingCost: 0, total: 6_800_000 })
    })

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("refuses the invalid shipping cost %s", (cost) => {
      expect(() => priceOrder([{ itemId: watch.id, quantity: 1 }], [watch], cost)).toThrow(/shipping cost/i)
    })

    it("still reports cart failures regardless of shipping", () => {
      expect(priceOrder([], [watch], 20_000)).toEqual({ ok: false, code: "EMPTY_CART" })
    })
  })

  it("ignores any price the client may have attached to a requested line", () => {
    const tampered = [{ itemId: watch.id, quantity: 1, price: 1, unitPrice: 1 }]
    const result = priceOrder(tampered, [watch])

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines[0].unitPrice).toBe(6_800_000)
      expect(result.total).toBe(6_800_000)
    }
  })

  it("merges duplicated lines of the same item", () => {
    const result = priceOrder(
      [
        { itemId: watch.id, quantity: 1 },
        { itemId: watch.id, quantity: 2 },
      ],
      [watch]
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].quantity).toBe(3)
      expect(result.total).toBe(20_400_000)
    }
  })

  it("rounds money to two decimals to avoid float drift", () => {
    const odd: CatalogItem = { ...chain, price: 33.333, inventory: 10 }
    const result = priceOrder([{ itemId: odd.id, quantity: 3 }], [odd])

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.total).toBe(100)
  })

  it("rejects an empty cart", () => {
    expect(priceOrder([], [watch])).toEqual({ ok: false, code: "EMPTY_CART" })
  })

  it("rejects an item that does not exist in the catalog", () => {
    expect(priceOrder([{ itemId: "665f1c2e8b3a4d0012a1b999", quantity: 1 }], [watch])).toEqual({
      ok: false,
      code: "ITEM_UNAVAILABLE",
      itemId: "665f1c2e8b3a4d0012a1b999",
    })
  })

  it("rejects inactive and soft-deleted items", () => {
    expect(
      priceOrder([{ itemId: watch.id, quantity: 1 }], [{ ...watch, isActive: false }])
    ).toMatchObject({ ok: false, code: "ITEM_UNAVAILABLE", itemId: watch.id })
    expect(
      priceOrder([{ itemId: watch.id, quantity: 1 }], [{ ...watch, deletedAt: new Date() }])
    ).toMatchObject({ ok: false, code: "ITEM_UNAVAILABLE", itemId: watch.id })
  })

  it("rejects quantities above the available inventory and reports what is left", () => {
    expect(priceOrder([{ itemId: watch.id, quantity: 5 }], [watch])).toEqual({
      ok: false,
      code: "INSUFFICIENT_STOCK",
      itemId: watch.id,
      available: 4,
    })
  })

  it("accepts exactly the remaining inventory", () => {
    expect(priceOrder([{ itemId: watch.id, quantity: 4 }], [watch]).ok).toBe(true)
  })

  it("treats zero inventory as insufficient", () => {
    expect(
      priceOrder([{ itemId: watch.id, quantity: 1 }], [{ ...watch, inventory: 0 }])
    ).toMatchObject({ ok: false, code: "INSUFFICIENT_STOCK", available: 0 })
  })

  it.each([0, -1, 1.5, 21])("rejects invalid quantity %s", (quantity) => {
    expect(
      priceOrder([{ itemId: watch.id, quantity }], [{ ...watch, inventory: 100 }])
    ).toMatchObject({ ok: false, code: "INVALID_QUANTITY", itemId: watch.id })
  })
})
