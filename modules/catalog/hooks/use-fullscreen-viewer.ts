import { useCallback, useEffect, useState } from "react"

/**
 * Open/close state of a full-screen viewer. While it is open the page scroll is locked
 * and Escape closes it; the arrow keys call `onStep(-1 | 1)`.
 */
export function useFullscreenViewer(onStep: (delta: number) => void) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
      else if (event.key === "ArrowRight") onStep(1)
      else if (event.key === "ArrowLeft") onStep(-1)
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, close, onStep])

  return { isOpen, open, close }
}
