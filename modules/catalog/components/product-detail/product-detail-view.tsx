import { resolveProductImages } from "../../utils/product-images"
import type { ProductDetail } from "../../types"
import ProductGallery from "../product-gallery/product-gallery"
import ProductBuyBox from "./product-buy-box"
import ProductDescription from "./product-description"
import ProductSummary from "./product-summary"

type ProductDetailViewProps = {
  product: ProductDetail
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { heroImage, galleryImages } = resolveProductImages(product.images)

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-[#f5f4f2] via-[#f3f2f0] to-[#efeeec]">
        <div className="mx-auto lg:pb-12">
          <ProductGallery name={product.name} images={galleryImages} />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-x-12 lg:gap-y-0">
            <ProductSummary name={product.name} price={product.price} />
            <ProductBuyBox product={product} image={heroImage} />
            <ProductDescription description={product.description} />
          </div>
        </div>
      </section>
    </div>
  )
}
