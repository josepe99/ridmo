import type { AnchorHTMLAttributes } from "react"

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  prefetch?: boolean
}

/** `next/link` replaced by a plain <a>. */
export default function Link({ prefetch: _prefetch, children, ...props }: LinkProps) {
  return <a {...props}>{children}</a>
}
