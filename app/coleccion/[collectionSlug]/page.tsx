import Link from "next/link"
import Image from "next/image"
import { collections, products } from "@/lib/data"
import { notFound } from "next/navigation"

type CollectionPageProps = {
  params: {
    collectionSlug: string
  }
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const collection = collections.find((c) => c.slug === params.collectionSlug)

  if (!collection) {
    notFound()
  }

  const collectionProducts = products.filter((p) => p.collectionSlug === collection.slug)

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{collection.name}</h1>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              {collection.description}
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {collectionProducts.length > 0 ? (
            collectionProducts.map((product) => (
              <div key={product.id} className="grid gap-1">
                <Link href={`/${collection.slug}/${product.slug}`} className="group" prefetch={false}>
                  <Image
                    src={product.imageUrl || "/placeholder.svg"}
                    width={300}
                    height={400}
                    alt={product.name}
                    className="mx-auto aspect-[3/4] overflow-hidden rounded-lg object-cover object-center sm:w-full transition-all group-hover:scale-105"
                  />
                </Link>
                <h2 className="text-lg font-bold pt-4">{product.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                <p className="text-base font-semibold mt-1">€{product.price.toFixed(2)}</p>
                <Link
                  href={`/${collection.slug}/${product.slug}`}
                  className="text-sm font-medium hover:underline underline-offset-4 mt-2"
                >
                  Ver Prenda
                </Link>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">No hay prendas en esta colección aún.</p>
          )}
        </div>
      </div>
    </section>
  )
}
