import "server-only"

import { unstable_cache } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import type {
  CollectionSummary,
  CollectionWithProducts,
  ProductSummary,
} from "../types"

const PREVIEW_ITEMS_PER_COLLECTION = 5
const MAX_COLLECTIONS = 100
const MAX_ITEMS_PER_COLLECTION_PAGE = 100

// Cached for the homepage - revalidates every 60 seconds
const getCachedActiveCollections = unstable_cache(
  async (): Promise<CollectionWithProducts[]> => {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        items: {
          where: { isActive: true },
          take: PREVIEW_ITEMS_PER_COLLECTION,
          select: { id: true, name: true, slug: true, price: true, images: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_COLLECTIONS,
    })

    return collections.map(({ items, ...collection }) => ({
      ...collection,
      products: items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        image: item.images?.[0] || null,
      })),
    }))
  },
  ["collections-list"],
  { revalidate: 60, tags: ["collections"] }
)

/** Active collections with a preview of their products (empty list on failure). */
export async function getActiveCollectionsWithProducts(): Promise<CollectionWithProducts[]> {
  try {
    return await getCachedActiveCollections()
  } catch (error) {
    console.error("Error fetching collections:", error)
    return []
  }
}

/** Collection by slug. Throws when it does not exist. */
export async function getCollectionBySlug(slug: string): Promise<CollectionSummary> {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
    },
  })

  if (!collection) {
    throw new Error("Collection not found")
  }

  return collection
}

/** Active products of a collection, newest first. Throws when the collection does not exist. */
export async function getProductsByCollectionSlug(
  collectionSlug: string
): Promise<ProductSummary[]> {
  const collection = await getCollectionBySlug(collectionSlug)

  const items = await prisma.item.findMany({
    where: { collectionId: collection.id, isActive: true },
    select: { id: true, name: true, slug: true, price: true, images: true },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEMS_PER_COLLECTION_PAGE,
  })

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    image: item.images?.[0] || null,
    collectionSlug,
  }))
}
