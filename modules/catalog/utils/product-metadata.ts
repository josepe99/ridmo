import type { Metadata } from "next"
import {
  DEFAULT_PRODUCT_DESCRIPTION,
  METADATA_DESCRIPTION_MAX_LENGTH,
  METADATA_FALLBACK_IMAGE,
  OPEN_GRAPH_LOCALE,
  SITE_BASE_URL,
  SITE_NAME,
  TWITTER_CREATOR,
} from "../constants/product"
import type { ProductDetail } from "../types"

/** Page metadata for a product; `collectionSlug` is the route's fallback when the product has none. */
export function buildProductMetadata(item: ProductDetail, collectionSlug: string): Metadata {
  const title = `${item.name} | ${SITE_NAME}`
  const description =
    item.description?.slice(0, METADATA_DESCRIPTION_MAX_LENGTH) || DEFAULT_PRODUCT_DESCRIPTION
  const imageUrl = item.images?.[0] || METADATA_FALLBACK_IMAGE
  const url = `${SITE_BASE_URL}/${item.collectionSlug || collectionSlug}/${item.slug}`

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${item.name} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: TWITTER_CREATOR,
    },
    alternates: {
      canonical: url,
    },
  }
}
