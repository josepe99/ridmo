import Link from "next/link"
import Image from "next/image"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"

type ProductPageProps = {
  params: {
    collectionSlug: string
    productSlug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.collectionSlug === params.collectionSlug && p.slug === params.productSlug)

  if (!product) {
    notFound()
  }

  // Filtrar productos relacionados de la misma colección, excluyendo el producto actual
  const relatedProducts = products.filter((p) => p.collectionSlug === product.collectionSlug && p.id !== product.id)

  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="flex justify-center">
          <Image
            src={product.imageUrl || "/placeholder.svg?height=600&width=400&query=product image"}
            width={400}
            height={600}
            alt={product.name}
            className="object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="grid gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold mt-2">€{product.price.toFixed(2)}</p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
            {/* Placeholder for size/color selection */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Talla:</span>
              <Button variant="outline" size="sm" className="rounded-none bg-transparent">
                S
              </Button>
              <Button variant="outline" size="sm" className="rounded-none bg-transparent">
                M
              </Button>
              <Button variant="outline" size="sm" className="rounded-none bg-transparent">
                L
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">Color:</span>
              <div className="w-6 h-6 rounded-full bg-black border border-gray-300 cursor-pointer" title="Negro"></div>
              <div className="w-6 h-6 rounded-full bg-white border border-gray-300 cursor-pointer" title="Blanco"></div>
              <div
                className="w-6 h-6 rounded-full bg-gray-500 border border-gray-300 cursor-pointer"
                title="Gris"
              ></div>
            </div>
          </div>
          <Button className="w-full py-3 bg-black text-white hover:bg-gray-800 rounded-none text-lg font-semibold">
            Añadir al Carrito
          </Button>
          <Link
            href={`/coleccion/${product.collectionSlug}`}
            className="text-sm text-gray-600 hover:underline mt-4 block"
          >
            Volver a la colección
          </Link>
        </div>
      </div>

      {/* Sección de Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="container px-4 md:px-6 mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">También te podría interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="grid gap-1 group">
                <Link href={`/${relatedProduct.collectionSlug}/${relatedProduct.slug}`} prefetch={false}>
                  <Image
                    src={relatedProduct.imageUrl || "/placeholder.svg?height=300&width=200&query=related product"}
                    width={200}
                    height={300}
                    alt={relatedProduct.name}
                    className="mx-auto aspect-[2/3] overflow-hidden object-cover object-center sm:w-full transition-all group-hover:scale-105"
                  />
                </Link>
                <h3 className="text-base font-semibold pt-2">{relatedProduct.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">€{relatedProduct.price.toFixed(2)}</p>
                <Link
                  href={`/${relatedProduct.collectionSlug}/${relatedProduct.slug}`}
                  className="text-xs font-medium hover:underline underline-offset-4 mt-1"
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
}
