"use client";

import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Item } from "@/lib/data";
import Price from "@/components/price";

type ProductCarouselProps = {
  title: string;
  products: Item[];
  collectionSlug?: string;
};

export default function ProductCarousel({
  title,
  products,
  collectionSlug,
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentDotIndex, setCurrentDotIndex] = useState(0);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1); // Ajuste para evitar un pixel de diferencia

      // Calculate current dot index based on scroll position and number of items
      const itemElement = scrollContainerRef.current.children[0]
        ?.children[0] as HTMLElement | undefined;
      if (itemElement) {
        const itemWidth = itemElement.offsetWidth + 12; // Item width + gap-3
        const scrollPosition = scrollLeft + clientWidth / 2; // Center of the view
        const newDotIndex = Math.floor(scrollPosition / itemWidth);
        setCurrentDotIndex(Math.min(newDotIndex, products.length - 1));
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const itemElement = scrollContainerRef.current.children[0]
        ?.children[0] as HTMLElement | undefined;
      const scrollAmount = itemElement
        ? itemElement.offsetWidth + 12
        : scrollContainerRef.current.clientWidth * 0.8;

      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    checkScrollability();
    const scrollContainer = scrollContainerRef.current;
    scrollContainer?.addEventListener("scroll", checkScrollability);
    window.addEventListener("resize", checkScrollability);

    return () => {
      scrollContainer?.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [products]);

  return (
    <section className="w-full py-16 md:py-24 bg-white border-t border-gray-100 relative">
      <div className="px-4 md:px-1">
        {title && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 uppercase tracking-wide">
            {title}
          </h2>
        )}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto mx-2 md:-mx-3 lg:mx-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-3 px-2 md:px-3 lg:px-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0 w-[240px] sm:w-[300px] md:w-[340px] lg:w-[380px]", // Tamaños más grandes
                  "relative flex flex-col items-center justify-start snap-start"
                )}
              >
                {/* Contenedor de la imagen con fondo blanco rectangular */}
                <div
                  className="relative w-full aspect-[3/4] max-h-[520px] bg-white
                    overflow-hidden border border-gray-100 flex items-center justify-center"
                >
                  <Link
                    href={`/${collectionSlug}/${product.slug}`}
                    className="group w-full h-full flex items-center justify-center"
                    prefetch={false}
                  >
                    <Image
                      src={
                        product.image ||
                        "/placeholder.svg?height=400&width=300&query=fashion product"
                      }
                      fill
                      style={{ objectFit: "contain" }}
                      alt={product.name}
                      className="transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="relative z-10 w-full text-left mt-4 px-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <Price
                    value={product.price}
                    className="text-base font-semibold mt-1"
                  />
                </div>
              </div>
            ))}
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0 w-[240px] sm:w-[300px] md:w-[340px] lg:w-[380px]", // Tamaños más grandes
                  "relative flex flex-col items-center justify-start snap-start"
                )}
              >
                {/* Contenedor de la imagen con fondo blanco rectangular */}
                <div
                  className="relative w-full aspect-[3/4] max-h-[520px] bg-white
                    overflow-hidden border border-gray-100 flex items-center justify-center"
                >
                  <Link
                    href={`/${collectionSlug}/${product.slug}`}
                    className="group w-full h-full flex items-center justify-center"
                    prefetch={false}
                  >
                    <Image
                      src={
                        product.image ||
                        "/placeholder.svg?height=400&width=300&query=fashion product"
                      }
                      fill
                      style={{ objectFit: "contain" }}
                      alt={product.name}
                      className="transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="relative z-10 w-full text-left mt-4 px-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <Price
                    value={product.price}
                    className="text-base font-semibold mt-1"
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
  );
}
