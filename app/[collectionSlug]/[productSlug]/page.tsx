import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getProductBySlug } from "@/modules/catalog/server"
import { ProductDetailView, buildProductMetadata } from "@/modules/catalog"

type ProductPageProps = {
  params: {
    collectionSlug: string
    productSlug: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productSlug } = await params
  try {
    const item = await getProductBySlug(productSlug)
    if (!item) return {}
    return buildProductMetadata(item, params.collectionSlug)
  } catch {
    return {}
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params

  try {
    const item = await getProductBySlug(productSlug)
    if (!item) {
      notFound()
    }

    return <ProductDetailView product={item} />
  } catch {
    notFound()
  }
}
