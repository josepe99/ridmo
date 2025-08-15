import { Metadata } from "next"
// Metadata dinámico para SEO y Open Graph de la colección
export async function generateMetadata({ params }: { params: { collectionSlug: string } }): Promise<Metadata> {
  const { collectionSlug } = params;
  try {
    const collection = await getCollectionBySlug(collectionSlug);
    if (!collection) return {};
    const title = `${collection.name} | Milo Wear Company`;
    const description = collection.description?.slice(0, 160) || `Descubre la colección ${collection.name} en Milo Wear Company.`;
    const imageUrl = collection.image || "/images/milo-logo.png";
    const url = `https://www.milocompany.store/${collection.slug}`;
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
            alt: `${collection.name} - Milo Wear Company`,
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
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getCollectionBySlug } from "@/lib/actions/collections"
import { getItemsByCollectionSlug } from "@/lib/actions/items"

type CollectionPageProps = {
  params: {
    collectionSlug: string
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionSlug } = await params
  
  try {
    // Get the collection and its items in parallel using Promise.all
    const [collection, items] = await Promise.all([
      getCollectionBySlug(collectionSlug),
      getItemsByCollectionSlug(collectionSlug)
    ])

    if (!collection) {
      notFound()
    }

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
                <BreadcrumbPage>{collection.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Collection Header */}
        <div className="container px-4 md:px-6 mb-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {collection.description}
              </p>
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div className="container px-4 md:px-6">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items.map((item: any) => (
                <div key={item.id} className="grid gap-1 group">
                  <Link href={`/${collectionSlug}/${item.slug}`} prefetch={false}>
                    <Image
                      src={item.images?.[0] || "/placeholder.svg?height=300&width=200&query=product"}
                      width={200}
                      height={300}
                      alt={item.name}
                      className="mx-auto aspect-[2/3] overflow-hidden object-cover object-center sm:w-full transition-all group-hover:scale-105 rounded-lg"
                    />
                  </Link>
                  <div className="space-y-1 pt-2">
                    <h3 className="text-base font-semibold line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Gs {Math.round(item.price).toLocaleString('es-PY')}
                    </p>
                    {item.comparePrice && item.comparePrice > item.price && (
                      <p className="text-xs text-gray-400 line-through">
                        Gs {Math.round(item.comparePrice).toLocaleString('es-PY')}
                      </p>
                    )}
                    <Link
                      href={`/${collectionSlug}/${item.slug}`}
                      className="text-xs font-medium hover:underline underline-offset-4 mt-1 block"
                    >
                      Ver Prenda
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Esta colección aún no tiene productos disponibles.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium hover:underline underline-offset-4"
              >
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  } catch (error) {
    notFound()
  }
}
