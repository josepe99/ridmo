import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { getProductBySlug } from "./products"

beforeEach(() => resetPrismaMock())

describe("getProductBySlug", () => {
  const row = {
    id: "i1",
    name: "Cadena Milán",
    slug: "cadena-milan",
    description: "Oro",
    price: 3_900_000,
    images: ["a.jpg", "b.jpg"],
    collection: { slug: "cadenas" },
  }

  it("maps the item and flattens the collection slug", async () => {
    prismaMock.item.findUnique.mockResolvedValue(row)

    await expect(getProductBySlug("cadena-milan")).resolves.toEqual({
      id: "i1",
      name: "Cadena Milán",
      slug: "cadena-milan",
      description: "Oro",
      price: 3_900_000,
      images: ["a.jpg", "b.jpg"],
      collectionSlug: "cadenas",
    })
  })

  it("returns a null collection slug when the item has no collection", async () => {
    prismaMock.item.findUnique.mockResolvedValue({ ...row, collection: null })

    const product = await getProductBySlug("cadena-milan")

    expect(product.collectionSlug).toBeNull()
  })

  it("throws when the product does not exist", async () => {
    prismaMock.item.findUnique.mockResolvedValue(null)

    await expect(getProductBySlug("nope")).rejects.toThrow("Item not found")
  })
})
