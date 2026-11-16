import { beforeEach, describe, expect, it, vi } from "vitest"
import { prismaMock, resetPrismaMock } from "@/tests/mocks/prisma"

vi.mock("@/shared/lib/prisma", async () => (await import("@/tests/mocks/prisma")).prismaModule)

import { getCollectionItemPreviews, getItemPreviewsByCollection } from "./item-previews"

const rawItem = (n: number, images?: string[]) => ({
  _id: { $oid: `i${n}` },
  name: `Item ${n}`,
  slug: `item-${n}`,
  price: n * 100,
  images,
})

beforeEach(() => {
  resetPrismaMock()
})

describe("getItemPreviewsByCollection", () => {
  it("groups previews by collection id using image[0] and image[1]", async () => {
    prismaMock.item.aggregateRaw.mockResolvedValue([
      { _id: { $oid: "c1" }, items: [rawItem(1, ["a.jpg", "b.jpg"]), rawItem(2, ["c.jpg"])] },
    ])

    const previews = await getItemPreviewsByCollection(["c1", "c2"], 5)

    expect(previews.get("c1")).toEqual([
      { id: "i1", name: "Item 1", slug: "item-1", price: 100, image: "a.jpg", hoverImage: "b.jpg" },
      { id: "i2", name: "Item 2", slug: "item-2", price: 200, image: "c.jpg", hoverImage: null },
    ])
    expect(previews.get("c2")).toBeUndefined()
  })

  it("uses null images for items without pictures", async () => {
    prismaMock.item.aggregateRaw.mockResolvedValue([
      { _id: { $oid: "c1" }, items: [rawItem(1, []), rawItem(2, undefined)] },
    ])

    const previews = await getItemPreviewsByCollection(["c1"], 5)

    expect(previews.get("c1")?.map((p) => [p.image, p.hoverImage])).toEqual([
      [null, null],
      [null, null],
    ])
  })

  it("asks the database for only 2 images per item, active items, newest first", async () => {
    prismaMock.item.aggregateRaw.mockResolvedValue([])

    await getItemPreviewsByCollection(["c1", "c2"], 5)

    const { pipeline } = prismaMock.item.aggregateRaw.mock.calls[0][0]
    expect(pipeline[0]).toEqual({
      $match: { collectionId: { $in: [{ $oid: "c1" }, { $oid: "c2" }] }, isActive: true },
    })
    expect(pipeline[1]).toEqual({ $sort: { createdAt: -1 } })
    expect(JSON.stringify(pipeline)).toContain('"images":{"$slice":["$images",2]}')
    expect(JSON.stringify(pipeline)).toContain('"items":{"$slice":["$items",5]}')
  })

  it("pushes field references, not literals, so price/name/slug keep their values", async () => {
    prismaMock.item.aggregateRaw.mockResolvedValue([])

    await getItemPreviewsByCollection(["c1"], 5)

    const { pipeline } = prismaMock.item.aggregateRaw.mock.calls[0][0]
    const group = pipeline.find((stage: Record<string, unknown>) => "$group" in stage)
    expect(group.$group.items.$push).toEqual({
      _id: "$_id",
      name: "$name",
      slug: "$slug",
      price: "$price",
      images: { $slice: ["$images", 2] },
    })
  })

  it("skips the query when there are no collections", async () => {
    const previews = await getItemPreviewsByCollection([], 5)

    expect(previews.size).toBe(0)
    expect(prismaMock.item.aggregateRaw).not.toHaveBeenCalled()
  })
})

describe("getCollectionItemPreviews", () => {
  it("returns previews for one collection with a bounded 2-image projection", async () => {
    prismaMock.item.aggregateRaw.mockResolvedValue([rawItem(1, ["a.jpg", "b.jpg"])])

    const previews = await getCollectionItemPreviews("c1", 100)

    expect(previews).toEqual([
      { id: "i1", name: "Item 1", slug: "item-1", price: 100, image: "a.jpg", hoverImage: "b.jpg" },
    ])
    const { pipeline } = prismaMock.item.aggregateRaw.mock.calls[0][0]
    expect(pipeline[0]).toEqual({ $match: { collectionId: { $oid: "c1" }, isActive: true } })
    expect(pipeline[1]).toEqual({ $sort: { createdAt: -1 } })
    expect(pipeline[2]).toEqual({ $limit: 100 })
    expect(JSON.stringify(pipeline)).toContain('"images":{"$slice":["$images",2]}')
  })
})
