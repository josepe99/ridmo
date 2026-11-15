import { describe, expect, it } from "vitest"
import { PRODUCT_PLACEHOLDER_IMAGE } from "../constants/product"
import { resolveProductImages } from "./product-images"

describe("resolveProductImages", () => {
  it("uses the first image as hero and keeps all images for the gallery", () => {
    expect(resolveProductImages(["a.jpg", "b.jpg"])).toEqual({
      heroImage: "a.jpg",
      galleryImages: ["a.jpg", "b.jpg"],
    })
  })

  it("ignores empty image URLs", () => {
    expect(resolveProductImages(["", "b.jpg", ""])).toEqual({
      heroImage: "b.jpg",
      galleryImages: ["b.jpg"],
    })
  })

  it.each([[[]], [[""]], [null], [undefined]])("falls back to the placeholder for %j", (images) => {
    expect(resolveProductImages(images)).toEqual({
      heroImage: PRODUCT_PLACEHOLDER_IMAGE,
      galleryImages: [PRODUCT_PLACEHOLDER_IMAGE],
    })
  })
})
