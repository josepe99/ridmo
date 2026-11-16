import type { MetadataRoute } from "next"
import { getSeoCatalog } from "@/modules/catalog/server"
import { absoluteUrl } from "@/shared/seo/site"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { collections, products } = await getSeoCatalog()

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...collections.map((collection) => ({
      url: absoluteUrl(`/${collection.slug}`),
      lastModified: collection.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/${product.collectionSlug}/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
