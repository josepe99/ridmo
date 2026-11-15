import Image from "next/image"
import { MAX_THUMBNAILS } from "../../constants/gallery"

type GalleryThumbnailsProps = {
  name: string
  images: string[]
  activeIndex: number
  onSelect: (index: number) => void
}

export default function GalleryThumbnails({ name, images, activeIndex, onSelect }: GalleryThumbnailsProps) {
  const thumbnails = images.slice(0, MAX_THUMBNAILS)
  const extraThumbnails = Math.max(0, images.length - MAX_THUMBNAILS)

  return (
    <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-white/90 px-3 py-2 shadow">
      {thumbnails.map((img, idx) => (
        <button
          key={`${img}-${idx}`}
          type="button"
          onClick={() => onSelect(idx)}
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
  )
}
