import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { GALLERY_FULLSCREEN_BUTTON_CLASS } from "../../constants/gallery"

type GalleryFullscreenViewerProps = {
  name: string
  image: string
  activeIndex: number
  count: number
  onClose: () => void
  onStep: (delta: number) => void
}

export default function GalleryFullscreenViewer({
  name,
  image,
  activeIndex,
  count,
  onClose,
  onStep,
}: GalleryFullscreenViewerProps) {
  const canNavigate = count > 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} - pantalla completa`}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black"
    >
      <div className="relative h-full w-full">
        <Image
          src={image}
          alt={`${name} pantalla completa`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`${GALLERY_FULLSCREEN_BUTTON_CLASS} right-4 top-4`}
        aria-label="Cerrar pantalla completa"
        autoFocus
      >
        <X className="h-5 w-5" />
      </button>
      {canNavigate ? (
        <>
          <button
            type="button"
            onClick={() => onStep(-1)}
            className={`${GALLERY_FULLSCREEN_BUTTON_CLASS} left-4 top-1/2 -translate-y-1/2`}
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            className={`${GALLERY_FULLSCREEN_BUTTON_CLASS} right-4 top-1/2 -translate-y-1/2`}
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {activeIndex + 1} / {count}
          </p>
        </>
      ) : null}
    </div>
  )
}
