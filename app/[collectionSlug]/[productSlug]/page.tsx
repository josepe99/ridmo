import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getProductBySlug } from "@/modules/catalog/server"
import { ProductDetailView, buildProductMetadata, buildProductUrl } from "@/modules/catalog"
import { JsonLd } from "@/shared/seo/json-ld"
import { breadcrumbSchema, productSchema } from "@/shared/seo/schemas"
import { absoluteUrl } from "@/shared/seo/site"

type ProductPageParams = {
  collectionSlug: string
  productSlug: string
}

type ProductPageProps = {
  params: ProductPageParams | Promise<ProductPageParams>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { collectionSlug, productSlug } = await params
  try {
    const item = await getProductBySlug(productSlug)
    if (!item) return {}
    return buildProductMetadata(item, collectionSlug)
  } catch {
    return {}
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { collectionSlug, productSlug } = await params

  try {
    const item = await getProductBySlug(productSlug)
    if (!item) {
      notFound()
    }

    const productUrl = buildProductUrl(item, collectionSlug)
    const ownerSlug = item.collectionSlug || collectionSlug

    return (
      <>
        <JsonLd
          data={[
            productSchema({
              name: item.name,
              description: item.description,
              price: item.price,
              images: item.images,
              tags: item.tags,
              inStock: item.inStock,
              url: productUrl,
              category: item.collectionName ?? undefined,
            }),
            breadcrumbSchema([
              { name: "Inicio", url: absoluteUrl("/") },
              { name: item.collectionName || ownerSlug, url: absoluteUrl(`/${ownerSlug}`) },
              { name: item.name, url: productUrl },
            ]),
          ]}
        />
        <ProductDetailView product={item} />
      </>
    )
  } catch {
    notFound()
  }
}
