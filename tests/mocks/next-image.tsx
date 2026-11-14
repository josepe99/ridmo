import type { ImgHTMLAttributes } from "react"

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
}

/** `next/image` replaced by a plain <img>; layout-only props are dropped. */
export default function Image({ fill: _fill, priority: _priority, ...props }: ImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />
}
