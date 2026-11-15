"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MAX_THUMBNAILS = 5

type ProductGalleryProps = {
  name: string
  /** Non-empty list of image URLs; the caller supplies a placeholder when the product has none. */
  images: string[]
}

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const count = images.length
  const heroLeft = images[activeIndex]
  const heroRight = images[(activeIndex + 1) % count]
  const thumbnails = images.slice(0, MAX_THUMBNAILS)
  const extraThumbnails = Math.max(0, count - MAX_THUMBNAILS)
  const canNavigate = count > 1

  const step = (delta: number) => setActiveIndex((current) => (current + delta + count) % count)

  // Mobile first: one portrait image with centered controls; from lg up, two tall images side by side.
  const heroFrame =
    "relative aspect-[4/5] w-full overflow-hidden bg-[#ecebea] lg:aspect-auto lg:h-[92vh] lg:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
  const navButton =
    "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 shadow hover:bg-white disabled:opacity-40 lg:h-8 lg:w-8"

  return (
    <div className="relative">
      <div className="grid lg:grid-cols-2">
        <div className={heroFrame}>
          <Image
            src={heroLeft}
            alt={`${name} view 1`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className={`${heroFrame} hidden lg:block`}>
          <Image
            src={heroRight}
            alt={`${name} view 2`}
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4 lg:inset-x-auto lg:bottom-5 lg:right-5 lg:items-end lg:px-0">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-white/90 px-3 py-2 shadow">
          {thumbnails.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-pressed={idx === activeIndex}
              className={`h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border ${
                idx === activeIndex ? "border-neutral-900" : "border-neutral-200"
              } bg-white`}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${idx + 1}`}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          {extraThumbnails > 0 ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-200 text-xs font-semibold text-neutral-600">
              +{extraThumbnails}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={!canNavigate}
            className={navButton}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={!canNavigate}
            className={navButton}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
