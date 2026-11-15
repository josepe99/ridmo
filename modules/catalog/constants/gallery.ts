/** Maximum number of thumbnails shown; the rest are summarised as "+N". */
export const MAX_THUMBNAILS = 5

// Mobile first: one portrait image with centered controls; from lg up, two tall images side by side.
export const GALLERY_HERO_FRAME_CLASS =
  "relative aspect-[4/5] w-full overflow-hidden bg-[#ecebea] lg:aspect-auto lg:h-[92vh] lg:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"

export const GALLERY_NAV_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 shadow hover:bg-white disabled:opacity-40 lg:h-8 lg:w-8"

export const GALLERY_FULLSCREEN_BUTTON_CLASS =
  "absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"
