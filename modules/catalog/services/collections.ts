import "server-only"

import { unstable_cache } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { getCollectionItemPreviews, getItemPreviewsByCollection } from "./item-previews"
import type {
  CollectionLink,
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
      // Same "active item" criterion the previews use, so a collection never renders empty.
      where: { isActive: true, items: { some: { isActive: true } } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
      orderBy: { createdAt: "desc" },
      take: MAX_COLLECTIONS,
    })

    const previews = await getItemPreviewsByCollection(
      collections.map((collection) => collection.id),
      PREVIEW_ITEMS_PER_COLLECTION
    )

    return collections.map((collection) => ({
      ...collection,
      products: previews.get(collection.id) ?? [],
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

const getCachedActiveCollectionLinks = unstable_cache(
  async (): Promise<CollectionLink[]> =>
    prisma.collection.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: MAX_COLLECTIONS,
    }),
  ["collection-links"],
  { revalidate: 60, tags: ["collections"] }
)

/** Active collections as navigation links, newest first (empty list on failure). */
export async function getActiveCollectionLinks(): Promise<CollectionLink[]> {
  try {
    return await getCachedActiveCollectionLinks()
  } catch (error) {
    console.error("Error fetching collection links:", error)
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

  const items = await getCollectionItemPreviews(
    collection.id,
    MAX_ITEMS_PER_COLLECTION_PAGE
  )

  return items.map((item) => ({ ...item, collectionSlug }))
}
