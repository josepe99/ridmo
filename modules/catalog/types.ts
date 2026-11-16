/**
 * Public DTOs of the catalog module.
 *
 * The domain calls an `Item` a "Product" in UI/DTO naming; the Prisma model
 * names (`Item`, `Collection`) stay untouched behind the services.
 */

/** Minimal product data needed to render a card in a grid. */
export type ProductSummary = {
  id: string
  name: string
  slug: string
  price: number
  /** First image of the product, or null when it has none. */
  image: string | null
  /** Second image of the product, shown on hover; null when it has only one. */
  hoverImage?: string | null
  /** Slug of the owning collection, when known by the caller. */
  collectionSlug?: string
}

/** Full product data needed by the product detail page. */
export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  images: string[]
  collectionSlug: string | null
}

/** Collection data needed by hero banners and collection pages. */
export type CollectionSummary = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
}

/** Minimal collection data needed to render a navigation link. */
export type CollectionLink = Pick<CollectionSummary, "id" | "name" | "slug">

/** A collection together with a preview of its active products. */
export type CollectionWithProducts = CollectionSummary & {
  products: ProductSummary[]
}
