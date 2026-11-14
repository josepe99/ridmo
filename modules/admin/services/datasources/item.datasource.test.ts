import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { ItemDatasource } from "./item.datasource"

const datasource = new ItemDatasource()

beforeEach(() => resetPrismaMock())

describe("ItemDatasource.findMany filters", () => {
  beforeEach(() => {
    prismaMock.item.findMany.mockResolvedValue([])
    prismaMock.item.count.mockResolvedValue(0)
  })

  const whereOfFirstCall = () => prismaMock.item.findMany.mock.calls[0][0].where

  it("applies no filter by default", async () => {
    await datasource.findMany()

    expect(whereOfFirstCall()).toEqual({})
  })

  it("filters by collection and active flag (including false)", async () => {
    await datasource.findMany({ collectionId: "c1", isActive: false })

    expect(whereOfFirstCall()).toEqual({ collectionId: "c1", isActive: false })
  })

  it("searches name, description and tags case-insensitively", async () => {
    await datasource.findMany({ search: "cadena" })

    expect(whereOfFirstCall().OR).toEqual([
      { name: { contains: "cadena", mode: "insensitive" } },
      { description: { contains: "cadena", mode: "insensitive" } },
      { tags: { hasSome: ["cadena"] } },
    ])
  })

  it("combines min and max price into one range", async () => {
    await datasource.findMany({ priceRange: { min: 10, max: 50 } })

    expect(whereOfFirstCall().price).toEqual({ gte: 10, lte: 50 })
  })

  it("supports a min-only range (and a zero minimum)", async () => {
    await datasource.findMany({ priceRange: { min: 0 } })

    expect(whereOfFirstCall().price).toEqual({ gte: 0 })
  })

  it("filters by any of the given tags, ignoring an empty list", async () => {
    await datasource.findMany({ tags: ["oro", "plata"] })
    await datasource.findMany({ tags: [] })

    expect(prismaMock.item.findMany.mock.calls[0][0].where.tags).toEqual({ hasSome: ["oro", "plata"] })
    expect(prismaMock.item.findMany.mock.calls[1][0].where.tags).toBeUndefined()
  })

  it("orders newest first, includes the collection and paginates", async () => {
    prismaMock.item.count.mockResolvedValue(35)

    const result = await datasource.findMany({ page: 4, limit: 10 })

    const args = prismaMock.item.findMany.mock.calls[0][0]
    expect(args).toMatchObject({
      include: { collection: true },
      orderBy: { createdAt: "desc" },
      skip: 30,
      take: 10,
    })
    expect(result.pagination).toMatchObject({ totalPages: 4, hasNext: false, hasPrev: true })
  })
})

describe("ItemDatasource lookups", () => {
  it("findById includes the collection unless told otherwise", async () => {
    await datasource.findById("i1")
    await datasource.findById("i1", false)

    expect(prismaMock.item.findUnique.mock.calls[0][0]).toEqual({
      where: { id: "i1" },
      include: { collection: true },
    })
    expect(prismaMock.item.findUnique.mock.calls[1][0].include).toBeUndefined()
  })

  it("findBySlug looks up by slug", async () => {
    await datasource.findBySlug("cadena")

    expect(prismaMock.item.findUnique.mock.calls[0][0].where).toEqual({ slug: "cadena" })
  })
})

describe("ItemDatasource writes", () => {
  it("create fills defaults for inventory, images, tags and isActive", async () => {
    await datasource.create({ name: "Cadena", slug: "cadena", price: 10, collectionId: "c1" })

    expect(prismaMock.item.create.mock.calls[0][0].data).toMatchObject({
      inventory: 0,
      images: [],
      tags: [],
      isActive: true,
    })
  })

  it("create keeps explicit values, including zero inventory and inactive", async () => {
    await datasource.create({
      name: "x",
      slug: "x",
      price: 1,
      collectionId: "c1",
      inventory: 0,
      isActive: false,
      images: ["a.jpg"],
      tags: ["t"],
    })

    expect(prismaMock.item.create.mock.calls[0][0].data).toMatchObject({
      inventory: 0,
      isActive: false,
      images: ["a.jpg"],
      tags: ["t"],
    })
  })

  it("update sends only provided fields, allowing falsy values like 0 and false", async () => {
    await datasource.update("i1", { price: 0, inventory: 0, isActive: false })

    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { price: 0, inventory: 0, isActive: false },
    })
  })

  it("delete removes by id", async () => {
    await datasource.delete("i1")

    expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: "i1" } })
  })

  it("updateInventory increments by the given delta", async () => {
    await datasource.updateInventory("i1", -3)

    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { inventory: { increment: -3 } },
    })
  })
})

describe("ItemDatasource catalog queries", () => {
  beforeEach(() => {
    prismaMock.item.findMany.mockResolvedValue([])
    prismaMock.item.count.mockResolvedValue(0)
  })

  it("findByCollection returns only active items of that collection", async () => {
    await datasource.findByCollection("c1", { page: 2, limit: 3 })

    expect(prismaMock.item.findMany.mock.calls[0][0]).toMatchObject({
      where: { collectionId: "c1", isActive: true },
      skip: 3,
      take: 3,
    })
  })

  it("searchItems matches name, description and tags among active items and counts the same set", async () => {
    await datasource.searchItems("oro")

    const findWhere = prismaMock.item.findMany.mock.calls[0][0].where
    const countWhere = prismaMock.item.count.mock.calls[0][0].where
    expect(findWhere.isActive).toBe(true)
    expect(findWhere.OR).toHaveLength(3)
    expect(countWhere).toEqual(findWhere)
  })

  it("getFeaturedItems returns the newest active items with a limit", async () => {
    await datasource.getFeaturedItems(3)

    expect(prismaMock.item.findMany.mock.calls[0][0]).toMatchObject({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    })
  })

  it("getItemsByPriceRange is inclusive and ordered by price ascending", async () => {
    await datasource.getItemsByPriceRange(10, 99)

    expect(prismaMock.item.findMany.mock.calls[0][0]).toMatchObject({
      where: { price: { gte: 10, lte: 99 }, isActive: true },
      orderBy: { price: "asc" },
    })
  })

  it("getRelatedItems excludes the current item", async () => {
    await datasource.getRelatedItems("i1", "c1")

    expect(prismaMock.item.findMany.mock.calls[0][0]).toMatchObject({
      where: { collectionId: "c1", isActive: true, NOT: { id: "i1" } },
      take: 4,
    })
  })
})

describe("ItemDatasource slug validation", () => {
  it("isSlugExists reports whether another item has the slug", async () => {
    prismaMock.item.findUnique.mockResolvedValueOnce({ id: "i2" }).mockResolvedValueOnce(null)

    await expect(datasource.isSlugExists("cadena")).resolves.toBe(true)
    await expect(datasource.isSlugExists("libre")).resolves.toBe(false)
  })

  it("isSlugExists excludes the item being edited", async () => {
    prismaMock.item.findUnique.mockResolvedValue(null)

    await datasource.isSlugExists("cadena", "i1")

    expect(prismaMock.item.findUnique.mock.calls[0][0].where).toEqual({
      slug: "cadena",
      NOT: { id: "i1" },
    })
  })

  it("validateSlug throws for a taken slug and passes for a free one", async () => {
    prismaMock.item.findUnique.mockResolvedValueOnce({ id: "i2" }).mockResolvedValueOnce(null)

    await expect(datasource.validateSlug("cadena")).rejects.toThrow(
      "An item with this slug already exists"
    )
    await expect(datasource.validateSlug("libre")).resolves.toBeUndefined()
  })
})
