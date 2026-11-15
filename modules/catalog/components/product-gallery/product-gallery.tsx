"use client"

import { useCallback, useState } from "react"
import { useFullscreenViewer } from "../../hooks/use-fullscreen-viewer"
import { stepIndex } from "../../utils/gallery-navigation"
import GalleryControls from "./gallery-controls"
import GalleryFullscreenViewer from "./gallery-fullscreen-viewer"
import GalleryHero from "./gallery-hero"
import GalleryThumbnails from "./gallery-thumbnails"

type ProductGalleryProps = {
  name: string
  /** Non-empty list of image URLs; the caller supplies a placeholder when the product has none. */
  images: string[]
}

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const count = images.length
  const nextIndex = stepIndex(activeIndex, 1, count)
  const canNavigate = count > 1

  const step = useCallback(
    (delta: number) => setActiveIndex((current) => stepIndex(current, delta, count)),
    [count]
  )
  const viewer = useFullscreenViewer(step)

  const openOnSecondImage = () => {
    setActiveIndex(nextIndex)
    viewer.open()
  }

  return (
    <div className="relative">
      <GalleryHero
        name={name}
        leftImage={images[activeIndex]}
        rightImage={images[nextIndex]}
        onOpenLeft={viewer.open}
        onOpenRight={openOnSecondImage}
      />
      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4 lg:inset-x-auto lg:bottom-5 lg:right-5 lg:items-end lg:px-0">
        <GalleryThumbnails name={name} images={images} activeIndex={activeIndex} onSelect={setActiveIndex} />
        <GalleryControls canNavigate={canNavigate} onOpenFullscreen={viewer.open} onStep={step} />
      </div>

      {viewer.isOpen ? (
        <GalleryFullscreenViewer
          name={name}
          image={images[activeIndex]}
          activeIndex={activeIndex}
          count={count}
          onClose={viewer.close}
          onStep={step}
        />
      ) : null}
    </div>
  )
}
