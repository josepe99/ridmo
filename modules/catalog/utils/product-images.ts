import { PRODUCT_PLACEHOLDER_IMAGE } from "../constants/product"

/** Hero image for the cart plus the non-empty list shown by the gallery (placeholder when there are none). */
export function resolveProductImages(images: string[] | null | undefined): {
  heroImage: string
  galleryImages: string[]
} {
  const validImages = Array.isArray(images) ? images.filter((img) => Boolean(img)) : []

  return {
    heroImage: validImages[0] || PRODUCT_PLACEHOLDER_IMAGE,
    galleryImages: validImages.length > 0 ? validImages : [PRODUCT_PLACEHOLDER_IMAGE],
  }
}
