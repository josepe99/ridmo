import "server-only"

import { prisma } from "@/shared/lib/prisma"
import type { ProductSummary } from "../types"

/**
 * Prisma cannot slice a scalar list (`String[]`) inside `select`, so the previews are read with
 * a MongoDB aggregation that projects only the first PREVIEW_IMAGES pictures of each item
 * (main image + hover image) instead of shipping every Cloudinary URL over the wire.
 */
const PREVIEW_IMAGES = 2

type RawItem = {
  _id: { $oid: string }
  name: string
  slug: string
  price: number
  images?: string[] | null
}

type RawCollectionGroup = { _id: { $oid: string }; items: RawItem[] }

const FIRST_IMAGES = { $slice: ["$images", PREVIEW_IMAGES] }

// `$project` takes inclusion flags (1)...
const ITEM_PREVIEW_PROJECT = { name: 1, slug: 1, price: 1, images: FIRST_IMAGES }

// ...but `$push` takes expressions: a bare `1` would be stored as the literal 1.
const ITEM_PREVIEW_PUSH = {
  _id: "$_id",
  name: "$name",
  slug: "$slug",
  price: "$price",
  images: FIRST_IMAGES,
}

function toProductSummary(raw: RawItem): ProductSummary {
  const images = raw.images ?? []
  return {
    id: raw._id.$oid,
    name: raw.name,
    slug: raw.slug,
    price: raw.price,
    image: images[0] || null,
    hoverImage: images[1] || null,
  }
}

/** Active items of several collections, newest first, at most `perCollection` each. */
export async function getItemPreviewsByCollection(
  collectionIds: string[],
  perCollection: number
): Promise<Map<string, ProductSummary[]>> {
  const previews = new Map<string, ProductSummary[]>()
  if (collectionIds.length === 0) return previews

  const groups = (await prisma.item.aggregateRaw({
    pipeline: [
      {
        $match: {
          collectionId: { $in: collectionIds.map((id) => ({ $oid: id })) },
          isActive: true,
        },
      },
      { $sort: { createdAt: -1 } },
      // Slice images before grouping so only 2 URLs per item are ever held in memory.
      {
        $group: {
          _id: "$collectionId",
          items: { $push: ITEM_PREVIEW_PUSH },
        },
      },
      { $project: { items: { $slice: ["$items", perCollection] } } },
    ],
  })) as unknown as RawCollectionGroup[]

  for (const group of groups) {
    previews.set(group._id.$oid, group.items.map(toProductSummary))
  }
  return previews
}

/** Active items of one collection, newest first, capped at `limit`. */
export async function getCollectionItemPreviews(
  collectionId: string,
  limit: number
): Promise<ProductSummary[]> {
  const items = (await prisma.item.aggregateRaw({
    pipeline: [
      { $match: { collectionId: { $oid: collectionId }, isActive: true } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $project: ITEM_PREVIEW_PROJECT },
    ],
  })) as unknown as RawItem[]

  return items.map(toProductSummary)
}
