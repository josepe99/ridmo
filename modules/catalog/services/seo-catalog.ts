import "server-only"

import { prisma } from "@/shared/lib/prisma"
import type { SeoCatalog } from "../types"

const MAX_COLLECTIONS = 100
const MAX_PRODUCTS = 1000

/** Active collections and products for sitemap.xml and llms.txt (empty on failure). */
export async function getSeoCatalog(): Promise<SeoCatalog> {
  try {
    const [collections, items] = await Promise.all([
      prisma.collection.findMany({
        where: { isActive: true, deletedAt: null },
        select: { name: true, slug: true, description: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: MAX_COLLECTIONS,
      }),
      prisma.item.findMany({
        where: { isActive: true, deletedAt: null, collection: { isActive: true } },
        select: {
          name: true,
          slug: true,
          description: true,
          price: true,
          updatedAt: true,
          collection: { select: { slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: MAX_PRODUCTS,
      }),
    ])

    return {
      collections,
      products: items.map(({ collection, ...item }) => ({ ...item, collectionSlug: collection.slug })),
    }
  } catch (error) {
    console.error("Error fetching SEO catalog:", error)
    return { collections: [], products: [] }
  }
}
