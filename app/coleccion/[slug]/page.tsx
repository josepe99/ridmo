import Link from "next/link"
import Image from "next/image"
import { collections, products } from "@/lib/data"
import { notFound } from "next/navigation"

type CollectionPageProps = {
  params: {
    slug: string
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { slug } = await params
  
  const collection = collections.find((c) => c.slug === slug)

  if (!collection) {
    notFound()
  }

  // Filtrar productos de esta colección
  const collectionProducts = products.filter((p) => p.collectionSlug === collection.slug)

  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        {/* Collection Hero */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{collection.name}</h1>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              {collection.description}
            </p>
          </div>
          <Link
            href="/coleccion"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Volver a todas las colecciones
          </Link>
        </div>

        {/* Products Grid */}
        {collectionProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {collectionProducts.map((product) => (
              <div key={product.id} className="grid gap-1 group">
                <Link href={`/${product.collectionSlug}/${product.slug}`} prefetch={false}>
                  <Image
                    src={product.imageUrl || "/placeholder.svg?height=300&width=200&query=product"}
                    width={200}
                    height={300}
                    alt={product.name}
                    className="mx-auto aspect-[2/3] overflow-hidden object-cover object-center sm:w-full transition-all group-hover:scale-105 rounded-lg"
                  />
                </Link>
                <h3 className="text-base font-semibold pt-2">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">€{product.price.toFixed(2)}</p>
                <Link
                  href={`/${product.collectionSlug}/${product.slug}`}
                  className="text-xs font-medium hover:underline underline-offset-4 mt-1"
                >
                  Ver Prenda
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No hay productos disponibles en esta colección.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
