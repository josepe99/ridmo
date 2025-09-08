import Link from "next/link"
import { Metadata } from "next"
import Image from "next/image"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getItemBySlug, getItemsByCollectionSlug } from "@/lib/actions/items"
// Metadata dinámico para SEO y Open Graph
export async function generateMetadata({ params }: { params: { collectionSlug: string; productSlug: string } }): Promise<Metadata> {
  const { productSlug } = params;
  try {
    const item = await getItemBySlug(productSlug);
    if (!item) return {};
    const title = `${item.name} | Milo Wear Company`;
    const description = item.description?.slice(0, 160) || "Descubre la mejor moda urbana en Milo Wear Company.";
    const imageUrl = item.images?.[0] || "/placeholder.jpg";
    const url = `https://www.milocompany.store/${item.collection?.slug || params.collectionSlug}/${item.slug}`;
    return {
      title,
      description,
      openGraph: {
        type: "website",
        locale: "es_PY",
        url,
        siteName: "Milo Wear Company",
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${item.name} - Milo Wear Company`,
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
    };
  } catch {
    return {};
  }
}
import AddToCartButton from "@/components/add-to-cart-button"
import Price from "@/components/price"

type ProductPageProps = {
  params: {
    collectionSlug: string
    productSlug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionSlug, productSlug } = await params
  
  try {
    // Get the item and related items in parallel using Promise.all
    const [item, relatedItems] = await Promise.all([
      getItemBySlug(productSlug),
      getItemsByCollectionSlug(collectionSlug)
    ])

    // Filter out the current item from related items
    const filteredRelatedItems = relatedItems.filter((i: any) => i.id !== item.id)

    return (
      <section className="py-12 md:py-24 lg:py-32">
        {/* Breadcrumb */}
        <div className="container px-4 md:px-6 mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${item.collection?.slug || collectionSlug}`}>
                    {item.collection?.name || 'Colección'}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex justify-center">
            {Array.isArray(item.images) && item.images.length > 0 ? (
              <div className="w-full max-w-xs sm:max-w-md">
                <Carousel>
                  <CarouselContent>
                    {item.images.map((img: string, idx: number) => (
                      <CarouselItem key={idx}>
                        <Image
                          src={img}
                          width={400}
                          height={600}
                          alt={item.name + " imagen " + (idx + 1)}
                          className="object-cover rounded-lg shadow-lg w-full h-auto"
                          priority={idx === 0}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            ) : (
              <Image
                src={"/placeholder.svg?height=600&width=400&query=product image"}
                width={400}
                height={600}
                alt={item.name}
                className="object-cover rounded-lg shadow-lg"
              />
            )}
          </div>
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{item.name}</h1>
              <Price value={item.price} className="text-2xl font-semibold mt-2" />
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              {/* Selección de talles */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-medium">Talla:</span>
                {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    size="sm"
                    className="rounded-none bg-transparent"
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">Color:</span>
                <div className="w-6 h-6 rounded-full bg-black border border-gray-300 cursor-pointer" title="Negro"></div>
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300 cursor-pointer" title="Blanco"></div>
              </div>
            </div>
            <AddToCartButton
              product={{
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.images?.[0],
                slug: item.slug
              }}
              className="w-full py-3 bg-black text-white hover:bg-gray-800 rounded-none text-lg font-semibold"
            />
            <Link
              href={`/${item.collection?.slug || collectionSlug}`}
              className="text-sm text-gray-600 hover:underline mt-4 block"
            >
              Volver a la colección
            </Link>
          </div>
        </div>

        {/* Sección de Productos Relacionados */}
        {filteredRelatedItems.length > 0 && (
          <div className="container px-4 md:px-6 mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">También te podría interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredRelatedItems.map((relatedItem: any) => (
                <div key={relatedItem.id} className="grid gap-1 group">
                  <Link href={`/${relatedItem.collection?.slug || collectionSlug}/${relatedItem.slug}`} prefetch={false}>
                    <Image
                      src={relatedItem.images?.[0] || "/placeholder.svg?height=300&width=200&query=related product"}
                      width={200}
                      height={300}
                      alt={relatedItem.name}
                      className="mx-auto aspect-[2/3] overflow-hidden object-cover object-center sm:w-full transition-all group-hover:scale-105"
                    />
                  </Link>
                  <h3 className="text-base font-semibold pt-2">{relatedItem.name}</h3>
                  <Price value={relatedItem.price} className="text-sm text-gray-500 dark:text-gray-400" />
                  <AddToCartButton
                    product={{
                      id: relatedItem.id,
                      name: relatedItem.name,
                      price: relatedItem.price,
                      image: relatedItem.images?.[0],
                      slug: relatedItem.slug
                    }}
                    className="w-full mt-2 bg-black hover:bg-gray-800 text-white font-medium py-1.5 px-3 rounded-none text-xs transition-colors"
                  >
                    AÑADIR AL CARRITO
                  </AddToCartButton>
                  <Link
                    href={`/${relatedItem.collection?.slug || collectionSlug}/${relatedItem.slug}`}
                    className="text-xs font-medium hover:underline underline-offset-4 mt-1 text-center"
                  >
                    Ver Prenda
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    )
  } catch (error) {
    notFound()
  }
}
