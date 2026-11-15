import Image from "next/image"
import { GALLERY_HERO_FRAME_CLASS } from "../../constants/gallery"

const OPEN_FULLSCREEN_LABEL = "Ver imagen en pantalla completa"
const HERO_BUTTON_CLASS = "absolute inset-0 block h-full w-full cursor-zoom-in"

type GalleryHeroProps = {
  name: string
  leftImage: string
  rightImage: string
  onOpenLeft: () => void
  onOpenRight: () => void
}

export default function GalleryHero({ name, leftImage, rightImage, onOpenLeft, onOpenRight }: GalleryHeroProps) {
  return (
    <div className="grid lg:grid-cols-2">
      <div className={GALLERY_HERO_FRAME_CLASS}>
        <button type="button" onClick={onOpenLeft} aria-label={OPEN_FULLSCREEN_LABEL} className={HERO_BUTTON_CLASS}>
          <Image
            src={leftImage}
            alt={`${name} view 1`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </button>
      </div>
      <div className={`${GALLERY_HERO_FRAME_CLASS} hidden lg:block`}>
        <button type="button" onClick={onOpenRight} aria-label={OPEN_FULLSCREEN_LABEL} className={HERO_BUTTON_CLASS}>
          <Image
            src={rightImage}
            alt={`${name} view 2`}
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
        </button>
      </div>
    </div>
  )
}
