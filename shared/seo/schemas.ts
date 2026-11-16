import {
  SITE_CURRENCY,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "./site"
import { CORE_KEYWORDS } from "./keywords"

export type JsonLdObject = Record<string, unknown>

const CONTEXT = "https://schema.org"
const ORGANIZATION_ID = `${SITE_URL}/#organization`

const AREA_SERVED = [
  { "@type": "Country", name: "Paraguay" },
  { "@type": "City", name: "Asunción" },
  { "@type": "City", name: "Lambaré" },
]

/** Online store entity. Contact details are included only when configured. */
export function organizationSchema(): JsonLdObject {
  const email = process.env.NEXT_PUBLIC_EMAIL
  const phone = process.env.NEXT_PUBLIC_PHONE_NUMBER

  return {
    "@context": CONTEXT,
    "@type": "OnlineStore",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(SITE_LOGO_PATH),
    image: absoluteUrl(SITE_LOGO_PATH),
    description: SITE_DESCRIPTION,
    areaServed: AREA_SERVED,
    knowsAbout: CORE_KEYWORDS,
    ...(email || phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: "Spanish",
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
          },
        }
      : {}),
  }
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": ORGANIZATION_ID },
  }
}

export type BreadcrumbEntry = { name: string; url: string }

export function breadcrumbSchema(entries: BreadcrumbEntry[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  }
}

export type ProductSchemaInput = {
  name: string
  description: string | null
  price: number
  images: string[]
  tags?: string[]
  inStock?: boolean
  url: string
  category?: string
}

export function productSchema(input: ProductSchemaInput): JsonLdObject {
  const images = input.images.filter(Boolean).map(absoluteUrl)

  return {
    "@context": CONTEXT,
    "@type": "Product",
    "@id": `${input.url}#product`,
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.tags && input.tags.length > 0 ? { keywords: input.tags.join(", ") } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: SITE_CURRENCY,
      price: input.price,
      itemCondition: `${CONTEXT}/NewCondition`,
      availability: `${CONTEXT}/${input.inStock === false ? "OutOfStock" : "InStock"}`,
      seller: { "@id": ORGANIZATION_ID },
    },
  }
}

export type CollectionSchemaInput = {
  name: string
  description: string | null
  url: string
  image?: string | null
  products: Array<{ name: string; url: string; image?: string | null }>
}

export function collectionSchema(input: CollectionSchemaInput): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: input.name,
    url: input.url,
    inLanguage: SITE_LANGUAGE,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.products.length,
      itemListElement: input.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: product.url,
        name: product.name,
        ...(product.image ? { image: absoluteUrl(product.image) } : {}),
      })),
    },
  }
}
