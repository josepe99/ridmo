import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { GALLERY_NAV_BUTTON_CLASS } from "../../constants/gallery"

type GalleryControlsProps = {
  canNavigate: boolean
  onOpenFullscreen: () => void
  onStep: (delta: number) => void
}

export default function GalleryControls({ canNavigate, onOpenFullscreen, onStep }: GalleryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenFullscreen}
        className={GALLERY_NAV_BUTTON_CLASS}
        aria-label="Pantalla completa"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={!canNavigate}
        className={GALLERY_NAV_BUTTON_CLASS}
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={!canNavigate}
        className={GALLERY_NAV_BUTTON_CLASS}
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
