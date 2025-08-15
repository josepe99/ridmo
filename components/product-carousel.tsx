"use client"

import { cn } from "@/lib/utils"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import type { Item } from "@/lib/data"
import AddToCartButton from "@/components/add-to-cart-button"

type ProductCarouselProps = {
  title: string
  products: Item[]
  collectionSlug?: string
}

export default function ProductCarousel({ title, products, collectionSlug }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [currentDotIndex, setCurrentDotIndex] = useState(0)

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1) // Ajuste para evitar un pixel de diferencia

      // Calculate current dot index based on scroll position and number of items
      const itemElement = scrollContainerRef.current.children[0]?.children[0] as HTMLElement | undefined
      if (itemElement) {
        const itemWidth = itemElement.offsetWidth + 32 // Item width + gap-8
        const scrollPosition = scrollLeft + clientWidth / 2 // Center of the view
        const newDotIndex = Math.floor(scrollPosition / itemWidth)
        setCurrentDotIndex(Math.min(newDotIndex, products.length - 1))
      }
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const itemElement = scrollContainerRef.current.children[0]?.children[0] as HTMLElement | undefined
      const scrollAmount = itemElement ? itemElement.offsetWidth + 32 : scrollContainerRef.current.clientWidth * 0.8

      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    checkScrollability()
    const scrollContainer = scrollContainerRef.current
    scrollContainer?.addEventListener("scroll", checkScrollability)
    window.addEventListener("resize", checkScrollability)

    return () => {
      scrollContainer?.removeEventListener("scroll", checkScrollability)
      window.removeEventListener("resize", checkScrollability)
    }
  }, [products])

  // Determine the number of dots based on visible items at different breakpoints
  const getItemsPerView = () => {
    if (typeof window === "undefined") return 2 // Default for server-side rendering
    if (window.innerWidth >= 1024) return 2.2 // lg - about 2 large items per view
    if (window.innerWidth >= 768) return 2 // md - 2 items per view  
    if (window.innerWidth >= 640) return 1.5 // sm - 1.5 items per view
    return 1.15 // Mobile - slightly more than 1 large item visible
  }

  const itemsPerView = getItemsPerView()

  return (
    <section className="w-full py-16 md:py-24 bg-white border-t border-gray-100 relative">
      <div className="px-4 md:px-6">
        {title && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 uppercase tracking-wide">{title}</h2>
        )}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto mx-4 md:-mx-6 lg:mx-8 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-8 px-4 md:px-6 lg:px-8">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0 w-[180px] sm:w-[220px] md:w-[240px] lg:w-[260px]", // Tamaños más pequeños
                  "relative flex flex-col items-center justify-start snap-start",
                )}
              >
                {/* Contenedor de la imagen con fondo blanco rectangular */}
                <div className="relative w-full aspect-[3/4] max-h-[320px] bg-white overflow-hidden border border-gray-100 flex items-center justify-center">
                  <Link
                    href={`/${collectionSlug}/${product.slug}`}
                    className="group w-full h-full flex items-center justify-center"
                    prefetch={false}
                  >
                    <div className="relative w-[120px] h-[160px] sm:w-[150px] sm:h-[200px] md:w-[180px] md:h-[240px] lg:w-[200px] lg:h-[260px]">
                      <Image
                        src={product.image || "/placeholder.svg?height=400&width=300&query=fashion product"}
                        fill
                        style={{ objectFit: "contain" }}
                        alt={product.name}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                </div>

                <div className="relative z-10 w-full text-left mt-4 px-2">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* "New" Tag */}
                      {product.id === "p1" && ( // Ejemplo: Asumiendo p1 es un producto nuevo
                        <p className="text-xs text-gray-500 mb-1">New</p>
                      )}
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{product.description}</p>
                      <p className="text-base font-semibold mt-1">Gs {Math.round(product.price).toLocaleString('es-PY')}</p>
                    </div>
                    {/* Heart Icon */}
                    <Button variant="ghost" size="icon" className="rounded-full self-start -mt-2">
                      <Heart className="h-5 w-5 text-gray-500 hover:text-black" />
                      <span className="sr-only">Añadir a lista de deseos</span>
                    </Button>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex gap-1 mt-2">
                    <div className="w-4 h-4 rounded-full bg-black border border-gray-300 cursor-pointer" />
                    <div className="w-4 h-4 rounded-full bg-white border border-gray-300 cursor-pointer" />
                  </div>

                  {/* Add to Cart Button */}
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      slug: product.slug
                    }}
                    className="w-full mt-4 bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white border border-black text-black shadow-md hover:bg-gray-100"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Anterior</span>
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white border border-black text-black shadow-md hover:bg-gray-100"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Siguiente</span>
          </Button>
        )}
      </div>
    </section>
  )
}
