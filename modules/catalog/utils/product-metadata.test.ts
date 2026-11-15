import { describe, expect, it } from "vitest"
import type { ProductDetail } from "../types"
import { buildProductMetadata } from "./product-metadata"

const product: ProductDetail = {
  id: "i1",
  name: "Cadena Milan",
  slug: "cadena-milan",
  description: "Oro de 18k",
  price: 3_900_000,
  images: ["https://res.cloudinary.com/1.jpg", "https://res.cloudinary.com/2.jpg"],
  collectionSlug: "cadenas",
}

describe("buildProductMetadata", () => {
  it("builds the full metadata from the product", () => {
    const url = "https://www.milocompany.store/cadenas/cadena-milan"

    expect(buildProductMetadata(product, "route-collection")).toEqual({
      title: "Cadena Milan | RIDMO",
      description: "Oro de 18k",
      openGraph: {
        type: "website",
        locale: "es_PY",
        url,
        siteName: "RIDMO",
        title: "Cadena Milan | RIDMO",
        description: "Oro de 18k",
        images: [{ url: product.images[0], width: 1200, height: 630, alt: "Cadena Milan - RIDMO" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Cadena Milan | RIDMO",
        description: "Oro de 18k",
        images: [product.images[0]],
        creator: "@milowearcompany",
      },
      alternates: { canonical: url },
    })
  })

  it("truncates the description to 160 characters", () => {
    const metadata = buildProductMetadata({ ...product, description: "x".repeat(200) }, "cadenas")

    expect(metadata.description).toBe("x".repeat(160))
  })

  it("falls back when the product has no description, images or collection", () => {
    const metadata = buildProductMetadata(
      { ...product, description: null, images: [], collectionSlug: null },
      "cadenas"
    )

    expect(metadata.description).toBe("Descubre la mejor moda urbana en RIDMO.")
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/placeholder.jpg" })])
    expect(metadata.twitter?.images).toEqual(["/placeholder.jpg"])
    expect(metadata.alternates?.canonical).toBe("https://www.milocompany.store/cadenas/cadena-milan")
  })
})
