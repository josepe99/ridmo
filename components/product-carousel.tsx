"use client"

import { cn } from "@/lib/utils"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import type { Item } from "@/lib/data"

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
          className="flex overflow-x-auto pb-4 mx-4 md:-mx-6 lg:mx-8 scrollbar-hide snap-x snap-mandatory"
        >
          <div className="flex gap-8 px-4 md:px-6 lg:px-8">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0 w-[calc(35%-1rem)] sm:w-[calc(65%-1.33rem)] md:w-[calc(50%-1.5rem)] lg:w-[calc(100%-1.5rem)]", // Much larger card sizes
                  "relative flex flex-col items-center justify-start snap-start",
                )}
              >
                {/* Contenedor de la imagen con fondo blanco rectangular */}
                <div className="relative w-full aspect-[3/4] bg-white overflow-hidden border border-gray-100">
                  <Link
                    href={`/${collectionSlug}/${product.slug}`}
                    className="group absolute inset-0 flex items-center justify-center"
                    prefetch={false}
                  >
                    <Image
                      src={product.image || "/placeholder.svg?height=400&width=300&query=fashion product"}
                      fill // Usar fill para que la imagen ocupe el contenedor
                      style={{ objectFit: "contain" }} // Mantener object-contain para que la imagen no se corte
                      alt={product.name}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
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
                      <p className="text-base font-semibold mt-1">€{product.price.toFixed(2)}</p>
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
                    <div className="w-4 h-4 rounded-full bg-amber-700 border border-gray-300 cursor-pointer" />
                  </div>
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

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-2 rounded-full border border-black",
                index === currentDotIndex ? "bg-black" : "bg-white",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
