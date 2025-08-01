import Link from "next/link"
import Image from "next/image"
import { collections } from "@/lib/data"

export default function CollectionsPage() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nuestras Colecciones</h1>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Explora las últimas tendencias y piezas atemporales de MILO. Cada colección es una declaración de estilo.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          {collections.map((collection) => (
            <div key={collection.id} className="grid gap-1">
              <Link href={`/coleccion/${collection.slug}`} className="group" prefetch={false}>
                <Image
                  src={collection.imageUrl || "/placeholder.svg"}
                  width={600}
                  height={400}
                  alt={collection.name}
                  className="mx-auto aspect-[3/2] overflow-hidden rounded-lg object-cover object-center sm:w-full transition-all group-hover:scale-105"
                />
              </Link>
              <h2 className="text-xl font-bold pt-4">{collection.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{collection.description}</p>
              <Link
                href={`/coleccion/${collection.slug}`}
                className="text-sm font-medium hover:underline underline-offset-4 mt-2"
              >
                Ver Colección
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
