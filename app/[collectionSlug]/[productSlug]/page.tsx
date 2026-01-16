import { getItemBySlug } from "@/lib/actions/items"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Menu,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react"
import AddToCartButton from "@/components/add-to-cart-button"
import Price from "@/components/price"

export async function generateMetadata({
  params,
}: {
  params: { collectionSlug: string; productSlug: string }
}): Promise<Metadata> {
  const { productSlug } = await params
  try {
    const item = await getItemBySlug(productSlug)
    if (!item) return {}
    const title = `${item.name} | RIDMO`
    const description =
      item.description?.slice(0, 160) || "Descubre la mejor moda urbana en RIDMO."
    const imageUrl = item.images?.[0] || "/placeholder.jpg"
    const url = `https://www.milocompany.store/${item.collection?.slug || params.collectionSlug}/${item.slug}`
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

type ProductPageProps = {
  params: {
    collectionSlug: string
    productSlug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params

  try {
    const item = await getItemBySlug(productSlug)
    if (!item) {
      notFound()
    }

    const fallbackImage =
      "/placeholder.svg?height=1200&width=900&query=product"
    const images = Array.isArray(item.images)
      ? item.images.filter((img: string) => Boolean(img))
      : []
    const heroLeft = images[0] || fallbackImage
    const heroRight = images[1] || heroLeft
    const thumbnailImages = images.length > 0 ? images.slice(0, 5) : [heroLeft]
    const extraThumbnails = Math.max(0, images.length - 5)
    const swatchImages = images.length > 0 ? images.slice(0, 4) : [heroLeft]

    return (
      <div className="bg-white">
        <section className="bg-gradient-to-b from-[#f5f4f2] via-[#f3f2f0] to-[#efeeec]">
          <div className="mx-auto pb-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
              <div className="relative">
                <div className="relative h-[62vh] w-full overflow-hidden bg-[#ecebea] shadow-[0_24px_60px_rgba(0,0,0,0.08)] lg:h-[92vh]">
                  <Image
                    src={heroLeft}
                    alt={`${item.name} view 1`}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              <div className="relative">
                <div className="relative h-[62vh] w-full overflow-hidden bg-[#ecebea] shadow-[0_24px_60px_rgba(0,0,0,0.08)] lg:h-[92vh]">
                  <Image
                    src={heroRight}
                    alt={`${item.name} view 2`}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-5 right-5 flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow">
                    {thumbnailImages.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        className={`h-10 w-10 overflow-hidden rounded-[10px] border ${
                          idx === 0 ? "border-neutral-900" : "border-neutral-200"
                        } bg-white`}
                        aria-label={`Thumbnail ${idx + 1}`}
                      >
                        <Image
                          src={img}
                          alt={`${item.name} thumbnail ${idx + 1}`}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                    {extraThumbnails > 0 ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-200 text-xs font-semibold text-neutral-600">
                        +{extraThumbnails}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 shadow hover:bg-white"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 shadow hover:bg-white"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-16">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Personalize with initials
                </p>
                <h1 className="mt-4 text-3xl font-medium text-neutral-900 md:text-4xl">
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

                <div className="mt-12">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Product Description
                  </p>
                  <p className="mt-4 text-sm leading-7 text-neutral-600">
                    {item.description ||
                      "A refined silhouette designed for everyday carry, finished with soft leather and polished hardware."}
                  </p>
                </div>

                <div className="mt-8 border-t border-neutral-200">
                  <details className="border-b border-neutral-200 py-4">
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
                      Product Details
                      <Plus className="h-4 w-4 text-neutral-500" />
                    </summary>
                    <div className="mt-3 text-sm text-neutral-600">
                      <ul className="space-y-2">
                        <li>Adjustable strap with polished hardware.</li>
                        <li>Interior pocket with magnetic closure.</li>
                        <li>Made in Italy.</li>
                      </ul>
                    </div>
                  </details>
                  <details className="border-b border-neutral-200 py-4">
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
                      Materials & Care
                      <Plus className="h-4 w-4 text-neutral-500" />
                    </summary>
                    <div className="mt-3 text-sm text-neutral-600">
                      <ul className="space-y-2">
                        <li>Soft-grain leather exterior.</li>
                        <li>Microfiber lining.</li>
                        <li>Protect from direct light, heat, and rain.</li>
                      </ul>
                    </div>
                  </details>
                  <details className="py-4">
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
                      Our Commitment
                      <Plus className="h-4 w-4 text-neutral-500" />
                    </summary>
                    <div className="mt-3 text-sm text-neutral-600">
                      <p>Responsibly sourced materials and artisan production.</p>
                    </div>
                  </details>
                </div>
              </div>

              <div className="lg:pl-10">
                <div className="sticky top-24 space-y-6">
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
                      Add to Bag
                    </span>
                  </AddToCartButton>
                  <div className="flex items-start gap-3 text-xs text-neutral-500">
                    <Truck className="mt-0.5 h-4 w-4" />
                    <span>
                      Estimated complimentary express delivery or collect in store:
                      Wed, Jan 21 - Thu, Jan 22
                    </span>
                  </div>
                  <div className="space-y-4 border-t border-neutral-200 pt-6 text-sm text-neutral-800">
                    <button type="button" className="flex items-center gap-3 underline underline-offset-4">
                      <Phone className="h-4 w-4" />
                      Order by phone
                    </button>
                    <button type="button" className="flex items-center gap-3 underline underline-offset-4">
                      <MapPin className="h-4 w-4" />
                      Find in store and book an appointment
                    </button>
                    <div className="pt-4">
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        RIDMO Services
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        Complimentary shipping, complimentary exchanges and returns,
                        secure payments and signature packaging.
                      </p>
                    </div>
                  </div>
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
