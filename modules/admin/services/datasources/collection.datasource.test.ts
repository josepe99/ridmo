import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { CollectionDatasource } from "./collection.datasource"

const datasource = new CollectionDatasource()
const OBJECT_ID = "64b7f0a0a0a0a0a0a0a0a0a0"

beforeEach(() => resetPrismaMock())

describe("CollectionDatasource.findMany", () => {
  it("paginates, filters by isActive only when it is a boolean and previews 5 active items", async () => {
    prismaMock.collection.findMany.mockResolvedValue([{ id: "c1" }])
    prismaMock.collection.count.mockResolvedValue(12)

    const result = await datasource.findMany({ page: 2, limit: 5, isActive: false })

    const args = prismaMock.collection.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ isActive: false })
    expect(args.skip).toBe(5)
    expect(args.take).toBe(5)
    expect(args.include.items.take).toBe(5)
    expect(args.include.items.where).toEqual({ isActive: true })
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it("applies no filter when isActive is not provided", async () => {
    prismaMock.collection.findMany.mockResolvedValue([])
    prismaMock.collection.count.mockResolvedValue(0)

    await datasource.findMany()

    expect(prismaMock.collection.findMany.mock.calls[0][0].where).toEqual({})
    expect(prismaMock.collection.findMany.mock.calls[0][0].skip).toBe(0)
  })
})

describe("CollectionDatasource lookups", () => {
  it("findById includes active items newest first by default", async () => {
    await datasource.findById("c1")

    expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
      where: { id: "c1" },
      include: { items: { where: { isActive: true }, orderBy: { createdAt: "desc" } } },
    })
  })

  it("findById can skip the items", async () => {
    await datasource.findById("c1", false)

    expect(prismaMock.collection.findUnique.mock.calls[0][0].include).toBeUndefined()
  })

  it("findBySlug looks up by slug with or without items", async () => {
    await datasource.findBySlug("cadenas")
    await datasource.findBySlug("cadenas", false)

    expect(prismaMock.collection.findUnique.mock.calls[0][0].where).toEqual({ slug: "cadenas" })
    expect(prismaMock.collection.findUnique.mock.calls[0][0].include).toBeDefined()
    expect(prismaMock.collection.findUnique.mock.calls[1][0].include).toBeUndefined()
  })
})

describe("CollectionDatasource writes", () => {
  it("create defaults isActive to true and sets deletedAt to null", async () => {
    await datasource.create({ name: "Cadenas", slug: "cadenas" })

    expect(prismaMock.collection.create).toHaveBeenCalledWith({
      data: {
        name: "Cadenas",
        slug: "cadenas",
        description: undefined,
        imageUrl: undefined,
        isActive: true,
        deletedAt: null,
      },
    })
  })

  it("create keeps an explicit isActive=false", async () => {
    await datasource.create({ name: "x", slug: "x", isActive: false })

    expect(prismaMock.collection.create.mock.calls[0][0].data.isActive).toBe(false)
  })

  it("update sends only the fields that were provided", async () => {
    await datasource.update("c1", { name: "Nuevo", isActive: false })

    expect(prismaMock.collection.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { name: "Nuevo", isActive: false },
    })
  })

  it("update can clear a description with an empty string", async () => {
    await datasource.update("c1", { description: "" })

    expect(prismaMock.collection.update.mock.calls[0][0].data).toEqual({ description: "" })
  })

  it("delete removes by id", async () => {
    await datasource.delete("c1")

    expect(prismaMock.collection.delete).toHaveBeenCalledWith({ where: { id: "c1" } })
  })

  it("getActiveCollections previews 3 active items per collection", async () => {
    await datasource.getActiveCollections()

    const args = prismaMock.collection.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ isActive: true })
    expect(args.include.items.take).toBe(3)
  })
})

describe("CollectionDatasource.getByAdmin", () => {
  it.each(["", "   "])("rejects a blank identifier %j", async (id) => {
    await expect(datasource.getByAdmin(id)).rejects.toThrow("Collection id or slug is required")
  })

  it("matches either id or slug when the identifier looks like an ObjectId", async () => {
    await datasource.getByAdmin(OBJECT_ID)

    expect(prismaMock.collection.findFirst.mock.calls[0][0].where).toEqual({
      OR: [{ id: OBJECT_ID }, { slug: OBJECT_ID }],
    })
    expect(prismaMock.collection.findUnique).not.toHaveBeenCalled()
  })

  it("looks up by slug otherwise, including inactive items", async () => {
    await datasource.getByAdmin("  cadenas ")

    expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
      where: { slug: "cadenas" },
      include: { items: { orderBy: { createdAt: "desc" } } },
    })
  })
})

describe("CollectionDatasource.getCollectionWithItems", () => {
  it("returns null when the collection does not exist", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null)

    await expect(datasource.getCollectionWithItems("nope")).resolves.toBeNull()
    expect(prismaMock.item.findMany).not.toHaveBeenCalled()
  })

  it("returns the collection with a paginated list of active items", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", slug: "cadenas" })
    prismaMock.item.findMany.mockResolvedValue([{ id: "i1" }])
    prismaMock.item.count.mockResolvedValue(30)

    const result = await datasource.getCollectionWithItems("cadenas", 2, 12)

    expect(prismaMock.item.findMany.mock.calls[0][0]).toMatchObject({
      where: { collectionId: "c1", isActive: true },
      skip: 12,
      take: 12,
    })
    expect(result).toEqual({
      id: "c1",
      slug: "cadenas",
      items: {
        data: [{ id: "i1" }],
        pagination: { page: 2, limit: 12, total: 30, totalPages: 3, hasNext: true, hasPrev: true },
      },
    })
  })
})
