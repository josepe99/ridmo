import { describe, expect, it } from "vitest"
import { serializeJsonLd } from "./json-ld"
import {
  breadcrumbSchema,
  collectionSchema,
  organizationSchema,
  productSchema,
  websiteSchema,
} from "./schemas"

describe("structured data", () => {
  it("describes the store as an online store serving Paraguay", () => {
    const org = organizationSchema()

    expect(org).toMatchObject({ "@type": "OnlineStore", name: "RIDMO" })
    expect(JSON.stringify(org.areaServed)).toContain("Lambaré")
    expect(websiteSchema()).toMatchObject({ "@type": "WebSite", publisher: { "@id": org["@id"] } })
  })

  it("builds a Product with a PYG offer and absolute image URLs", () => {
    const schema = productSchema({
      name: "Cadena Milan",
      description: "Oro",
      price: 3_900_000,
      images: ["/a.jpg", "https://res.cloudinary.com/b.jpg", ""],
      tags: ["oro", "cubana"],
      inStock: true,
      url: "https://www.milocompany.store/cadenas/cadena-milan",
      category: "Cadenas",
    })

    expect(schema).toMatchObject({
      "@type": "Product",
      keywords: "oro, cubana",
      category: "Cadenas",
      offers: {
        priceCurrency: "PYG",
        price: 3_900_000,
        availability: "https://schema.org/InStock",
      },
    })
    expect(schema.image).toEqual(["https://www.milocompany.store/a.jpg", "https://res.cloudinary.com/b.jpg"])
  })

  it("marks the product out of stock and omits empty optional fields", () => {
    const schema = productSchema({
      name: "X",
      description: null,
      price: 1,
      images: [],
      inStock: false,
      url: "https://www.milocompany.store/c/x",
    })

    expect(schema).not.toHaveProperty("description")
    expect(schema).not.toHaveProperty("image")
    expect(schema).not.toHaveProperty("keywords")
    expect(schema.offers).toMatchObject({ availability: "https://schema.org/OutOfStock" })
  })

  it("builds a collection page with a positioned item list", () => {
    const schema = collectionSchema({
      name: "Cadenas",
      description: null,
      url: "https://www.milocompany.store/cadenas",
      products: [
        { name: "A", url: "https://www.milocompany.store/cadenas/a", image: null },
        { name: "B", url: "https://www.milocompany.store/cadenas/b", image: "/b.jpg" },
      ],
    })

    expect(schema).toMatchObject({
      "@type": "CollectionPage",
      mainEntity: { numberOfItems: 2 },
    })
    expect((schema.mainEntity as { itemListElement: unknown[] }).itemListElement[1]).toMatchObject({
      position: 2,
      image: "https://www.milocompany.store/b.jpg",
    })
  })

  it("numbers breadcrumb entries from 1", () => {
    const schema = breadcrumbSchema([
      { name: "Inicio", url: "https://www.milocompany.store/" },
      { name: "Cadenas", url: "https://www.milocompany.store/cadenas" },
    ])

    expect(schema.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: "Inicio" }),
      expect.objectContaining({ position: 2, name: "Cadenas" }),
    ])
  })

  it("escapes < so descriptions cannot close the script tag", () => {
    expect(serializeJsonLd({ name: "</script><b>" })).not.toContain("</script>")
  })
})
