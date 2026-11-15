import { getProductBySlug } from "@/modules/catalog/server"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import { Plus, ShoppingBag, Truck } from "lucide-react"
import { AddToCartButton } from "@/modules/cart"
import { Price, ProductGallery } from "@/modules/catalog"
import { getShippingRateRows } from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"

export async function generateMetadata({
  params,
}: {
  params: { collectionSlug: string; productSlug: string }
}): Promise<Metadata> {
  const { productSlug } = await params
  try {
    const item = await getProductBySlug(productSlug)
    if (!item) return {}
    const title = `${item.name} | RIDMO`
    const description =
      item.description?.slice(0, 160) || "Descubre la mejor moda urbana en RIDMO."
    const imageUrl = item.images?.[0] || "/placeholder.jpg"
    const url = `https://www.milocompany.store/${item.collectionSlug || params.collectionSlug}/${item.slug}`
    return {
      title,
      description,
      openGraph: {
        type: "website",
        locale: "es_PY",
        url,
        siteName: "RIDMO",
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${item.name} - RIDMO`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@milowearcompany",
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {}
  }
}

const SHIPPING_RATES = getShippingRateRows()

/** Public price list text: "Gs. 20.000", or "A cotizar" for rows the shop quotes case by case. */
const rateCost = (cost: number | null) => (cost === null ? "A cotizar" : formatGuaranies(cost))

type ProductPageProps = {
  params: {
    collectionSlug: string
    productSlug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params

  try {
    const item = await getProductBySlug(productSlug)
    if (!item) {
      notFound()
    }

    const fallbackImage =
      "/placeholder.svg?height=1200&width=900&query=product"
    const images = Array.isArray(item.images)
      ? item.images.filter((img: string) => Boolean(img))
      : []
    const heroLeft = images[0] || fallbackImage
    const galleryImages = images.length > 0 ? images : [fallbackImage]
    const swatchImages = images.length > 0 ? images.slice(0, 4) : [heroLeft]

    return (
      <div className="bg-white">
        <section className="bg-gradient-to-b from-[#f5f4f2] via-[#f3f2f0] to-[#efeeec]">
          <div className="mx-auto lg:pb-12">
            <ProductGallery name={item.name} images={galleryImages} />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-x-12 lg:gap-y-0">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Personalize with initials
                </p>
                <h1 className="mt-4 text-2xl font-medium text-neutral-900 sm:text-3xl md:text-4xl">
                  {item.name}
                </h1>
                <div className="mt-4">
                  <Price value={item.price} className="text-neutral-900" />
                </div>

                <div className="mt-8">
                  <p className="text-sm text-neutral-700">
                    Variation black leather
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {swatchImages.map((img, idx) => (
                      <button
                        key={`swatch-${idx}`}
                        type="button"
                        className={`h-12 w-12 overflow-hidden rounded-full border ${
                          idx === 1 ? "border-neutral-900" : "border-neutral-200"
                        } bg-white`}
                        aria-label={`Variation ${idx + 1}`}
                      >
                        <Image
                          src={img}
                          alt={`${item.name} variation ${idx + 1}`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-6 flex w-full items-center justify-between border border-neutral-200 px-4 py-3 text-sm text-neutral-700"
                >
                  <span>Complimentary Personalization</span>
                  <Plus className="h-4 w-4" />
                </button>

              </div>

              {/* Second in the DOM so the buy box follows the price on mobile; pinned to the right column from lg up. */}
              <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-10">
                <div className="space-y-6 lg:sticky lg:top-24">
                  <AddToCartButton
                    product={{
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: heroLeft,
                      slug: item.slug,
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
                    <span>
                      Envíos a todo el país y al exterior. El costo depende de
                      la zona.
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-6 text-sm text-neutral-800">
                    <details>
                      <summary className="flex cursor-pointer items-center gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                        <Plus className="h-4 w-4" />
                        Costos de envío
                      </summary>
                      <ul className="mt-3 space-y-3 text-sm text-neutral-600">
                        {SHIPPING_RATES.map((rate) => (
                          <li
                            key={rate.id}
                            className="flex items-start justify-between gap-4"
                          >
                            <span>
                              {rate.zone}
                              {rate.note && (
                                <span className="block text-xs text-neutral-500">
                                  {rate.note}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-medium text-neutral-900">
                              {rateCost(rate.cost)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                    <div className="mt-6">
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Servicios RIDMO
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        Envíos a todo el país y al exterior, cambios y
                        devoluciones sin costo, pagos seguros y empaque
                        exclusivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-start-1 lg:mt-12">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Product Description
                  </p>
                  <p className="mt-4 text-sm leading-7 text-neutral-600">
                    {item.description ||
                      "A refined silhouette designed for everyday carry, finished with soft leather and polished hardware."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  } catch {
    notFound()
  }
}
