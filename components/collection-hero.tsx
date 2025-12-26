"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Pause } from "lucide-react"

type Collection = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl?: string
}

type CollectionHeroProps = {
  collections: Collection[]
}

export default function CollectionHero({ collections }: CollectionHeroProps) {
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0)

  const goToNextCollection = () => {
    setCurrentCollectionIndex((prevIndex) => (prevIndex + 1) % collections.length)
  }

  const goToPrevCollection = () => {
    setCurrentCollectionIndex((prevIndex) => (prevIndex - 1 + collections.length) % collections.length)
  }

  if (!collections || collections.length === 0) {
    return (
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Nueva Colección RIDMO"
            fill
            style={{ objectFit: "cover" }}
            className="z-0"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="relative z-20 flex flex-col items-start justify-center h-full px-4 md:px-12 lg:px-24 text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 drop-shadow-lg">
              COLECCIÓN OTOÑO 2025
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md">
              Descubre la sofisticación y el diseño atemporal en nuestra última propuesta.
            </p>
            <Link href="/coleccion">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-none transition-colors">
                DESCUBRIR
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const activeCollection = collections[currentCollectionIndex]

  return (
    <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      <div className="relative w-full h-full">
        <Image
          src={activeCollection.imageUrl || "/placeholder.svg?height=1080&width=1920"}
          alt={activeCollection.name}
          fill
          style={{ objectFit: "cover" }}
          className="z-0"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="relative z-20 flex flex-col items-start justify-center h-full px-4 md:px-12 lg:px-24 text-white">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 drop-shadow-lg">
            {activeCollection.name.toUpperCase()}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md">
            {activeCollection.description}
          </p>
          <Link href={`/${activeCollection.slug}`}>
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-none transition-colors">
              DESCUBRIR
            </Button>
          </Link>
        </div>
        {/* Carousel Navigation */}
        {collections.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center z-30">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full"
                onClick={goToPrevCollection}
              >
                <ChevronLeft className="h-8 w-8" />
                <span className="sr-only">Anterior</span>
              </Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center z-30">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full"
                onClick={goToNextCollection}
              >
                <ChevronRight className="h-8 w-8" />
                <span className="sr-only">Siguiente</span>
              </Button>
            </div>
            {/* Pause Button (Placeholder) */}
            <div className="absolute bottom-8 right-8 z-30">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                <Pause className="h-6 w-6" />
                <span className="sr-only">Pausar</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
