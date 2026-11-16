import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)
vi.mock("next/cache", async () => await import("@/tests/mocks/next-cache"))

import {
  getActiveCollectionLinks,
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

const rawItem = (id: string, images?: string[]) => ({
  _id: { $oid: id },
  name: "Cadena",
  slug: "cadena",
  price: 100,
  images,
})

describe("getActiveCollectionsWithProducts", () => {
  it("attaches each collection's previews with the first two images", async () => {
    prismaMock.collection.findMany.mockResolvedValue([collectionRow])
    prismaMock.item.aggregateRaw.mockResolvedValue([
      { _id: { $oid: "c1" }, items: [rawItem("i1", ["a.jpg", "b.jpg"])] },
    ])

    const result = await getActiveCollectionsWithProducts()

    expect(result).toEqual([
      {
        ...collectionRow,
        products: [
          { id: "i1", name: "Cadena", slug: "cadena", price: 100, image: "a.jpg", hoverImage: "b.jpg" },
        ],
      },
    ])
  })

  it("keeps collections that have no active items with an empty product list", async () => {
    prismaMock.collection.findMany.mockResolvedValue([collectionRow])
    prismaMock.item.aggregateRaw.mockResolvedValue([])

    const [collection] = await getActiveCollectionsWithProducts()

    expect(collection.products).toEqual([])
  })

  it("only queries active collections, newest first, without loading their items", async () => {
    prismaMock.collection.findMany.mockResolvedValue([])

    await getActiveCollectionsWithProducts()

    const args = prismaMock.collection.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ isActive: true })
    expect(args.select.items).toBeUndefined()
    expect(args.orderBy).toEqual({ createdAt: "desc" })
  })

  it("returns an empty list instead of throwing when the database fails", async () => {
    prismaMock.collection.findMany.mockRejectedValue(new Error("db down"))

    await expect(getActiveCollectionsWithProducts()).resolves.toEqual([])
    expect(console.error).toHaveBeenCalled()
  })
})

describe("getActiveCollectionLinks", () => {
  it("lists active collections newest first, selecting only what a link needs", async () => {
    prismaMock.collection.findMany.mockResolvedValue([
      { id: "c2", name: "Nueva", slug: "nueva" },
      { id: "c1", name: "Vieja", slug: "vieja" },
    ])

    const links = await getActiveCollectionLinks()

    expect(links).toEqual([
      { id: "c2", name: "Nueva", slug: "nueva" },
      { id: "c1", name: "Vieja", slug: "vieja" },
    ])
    const args = prismaMock.collection.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ isActive: true })
    expect(args.orderBy).toEqual({ createdAt: "desc" })
    expect(args.select).toEqual({ id: true, name: true, slug: true })
  })

  it("returns an empty list instead of throwing when the database fails", async () => {
    prismaMock.collection.findMany.mockRejectedValue(new Error("db down"))

    await expect(getActiveCollectionLinks()).resolves.toEqual([])
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
    prismaMock.item.aggregateRaw.mockResolvedValue([
      rawItem("i1", ["a.jpg", "b.jpg"]),
      { ...rawItem("i2", []), name: "Sin foto", slug: "sin-foto", price: 50 },
    ])

    const products = await getProductsByCollectionSlug("cadenas")

    const { pipeline } = prismaMock.item.aggregateRaw.mock.calls[0][0]
    expect(pipeline[0]).toEqual({ $match: { collectionId: { $oid: "c1" }, isActive: true } })
    expect(products).toEqual([
      {
        id: "i1", name: "Cadena", slug: "cadena", price: 100,
        image: "a.jpg", hoverImage: "b.jpg", collectionSlug: "cadenas",
      },
      {
        id: "i2", name: "Sin foto", slug: "sin-foto", price: 50,
        image: null, hoverImage: null, collectionSlug: "cadenas",
      },
    ])
  })

  it("propagates the not-found error and never queries items", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)

    await expect(getProductsByCollectionSlug("nope")).rejects.toThrow("Collection not found")
    expect(prismaMock.item.aggregateRaw).not.toHaveBeenCalled()
  })
})
