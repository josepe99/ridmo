import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)
vi.mock("next/cache", async () => await import("@/tests/mocks/next-cache"))

import {
  getActiveCollectionsWithProducts,
  getCollectionBySlug,
  getProductsByCollectionSlug,
} from "./collections"

const collectionRow = {
  id: "c1",
  name: "Cadenas",
  slug: "cadenas",
  description: "Cadenas macizas",
  imageUrl: "https://res.cloudinary.com/x/cadenas.jpg",
}

beforeEach(() => {
  resetPrismaMock()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("getActiveCollectionsWithProducts", () => {
  it("maps items to product summaries using the first image", async () => {
    prismaMock.collection.findMany.mockResolvedValue([
      {
        ...collectionRow,
        items: [
          { id: "i1", name: "Cadena", slug: "cadena", price: 100, images: ["a.jpg", "b.jpg"] },
        ],
      },
    ])

    const result = await getActiveCollectionsWithProducts()

    expect(result).toEqual([
      {
        ...collectionRow,
        products: [{ id: "i1", name: "Cadena", slug: "cadena", price: 100, image: "a.jpg" }],
      },
    ])
  })

  it("uses a null image for products that have no pictures", async () => {
    prismaMock.collection.findMany.mockResolvedValue([
      {
        ...collectionRow,
        items: [
          { id: "i1", name: "A", slug: "a", price: 1, images: [] },
          { id: "i2", name: "B", slug: "b", price: 2, images: undefined },
        ],
      },
    ])

    const [collection] = await getActiveCollectionsWithProducts()

    expect(collection.products.map((product) => product.image)).toEqual([null, null])
  })

  it("only queries active collections and previews only active items", async () => {
    prismaMock.collection.findMany.mockResolvedValue([])

    await getActiveCollectionsWithProducts()

    const args = prismaMock.collection.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ isActive: true })
    expect(args.select.items.where).toEqual({ isActive: true })
    expect(args.orderBy).toEqual({ createdAt: "desc" })
  })

  it("returns an empty list instead of throwing when the database fails", async () => {
    prismaMock.collection.findMany.mockRejectedValue(new Error("db down"))

    await expect(getActiveCollectionsWithProducts()).resolves.toEqual([])
    expect(console.error).toHaveBeenCalled()
  })
})

describe("getCollectionBySlug", () => {
  it("returns the collection summary", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(collectionRow)

    await expect(getCollectionBySlug("cadenas")).resolves.toEqual(collectionRow)
    expect(prismaMock.collection.findUnique.mock.calls[0][0].where).toEqual({ slug: "cadenas" })
  })

  it("throws when the collection does not exist", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)

    await expect(getCollectionBySlug("nope")).rejects.toThrow("Collection not found")
  })
})

describe("getProductsByCollectionSlug", () => {
  it("lists active products of the collection tagged with the collection slug", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(collectionRow)
    prismaMock.item.findMany.mockResolvedValue([
      { id: "i1", name: "Cadena", slug: "cadena", price: 100, images: ["a.jpg"] },
      { id: "i2", name: "Sin foto", slug: "sin-foto", price: 50, images: [] },
    ])

    const products = await getProductsByCollectionSlug("cadenas")

    expect(prismaMock.item.findMany.mock.calls[0][0].where).toEqual({
      collectionId: "c1",
      isActive: true,
    })
    expect(products).toEqual([
      { id: "i1", name: "Cadena", slug: "cadena", price: 100, image: "a.jpg", collectionSlug: "cadenas" },
      { id: "i2", name: "Sin foto", slug: "sin-foto", price: 50, image: null, collectionSlug: "cadenas" },
    ])
  })

  it("propagates the not-found error and never queries items", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)

    await expect(getProductsByCollectionSlug("nope")).rejects.toThrow("Collection not found")
    expect(prismaMock.item.findMany).not.toHaveBeenCalled()
  })
})
