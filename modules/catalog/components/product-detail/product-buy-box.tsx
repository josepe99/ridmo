import { ShoppingBag, Truck } from "lucide-react"
import { AddToCartButton } from "@/modules/cart"
import type { ProductDetail } from "../../types"
import ProductServices from "./product-services"
import ShippingRatesList from "./shipping-rates-list"

type ProductBuyBoxProps = {
  product: ProductDetail
  /** Image stored with the cart line. */
  image: string
}

export default function ProductBuyBox({ product, image }: ProductBuyBoxProps) {
  return (
    // Second in the DOM so the buy box follows the price on mobile; pinned to the right column from lg up.
    <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-10">
      <div className="space-y-6 lg:sticky lg:top-24">
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image,
            slug: product.slug,
          }}
          size="lg"
          className="w-full rounded-none bg-black py-4 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-neutral-800"
        >
          <span className="flex items-center justify-center gap-3">
            <ShoppingBag className="h-4 w-4" />
            Agregar al carrito
          </span>
        </AddToCartButton>
        <div className="flex items-start gap-3 text-xs text-neutral-500">
          <Truck className="mt-0.5 h-4 w-4" />
          <span>Envíos a todo el país y al exterior. El costo depende de la zona.</span>
        </div>
        <div className="border-t border-neutral-200 pt-6 text-sm text-neutral-800">
          <ShippingRatesList />
          <ProductServices />
        </div>
      </div>
    </div>
  )
}
