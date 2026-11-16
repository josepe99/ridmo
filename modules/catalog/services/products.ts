import "server-only"

import { prisma } from "@/shared/lib/prisma"
import type { ProductDetail } from "../types"

/** Product by slug. Throws when it does not exist. */
export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const item = await prisma.item.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      images: true,
      tags: true,
      inventory: true,
      collection: { select: { slug: true, name: true } },
    },
  })

  if (!item) {
    throw new Error("Item not found")
  }

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: item.price,
    images: item.images,
    collectionSlug: item.collection?.slug ?? null,
    collectionName: item.collection?.name ?? null,
    tags: item.tags ?? [],
    inStock: (item.inventory ?? 0) > 0,
  }
}
