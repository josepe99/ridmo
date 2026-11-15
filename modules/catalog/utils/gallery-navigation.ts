/** Moves `current` by `delta` inside a list of `count` items, wrapping around at both ends. */
export function stepIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0
  return (((current + delta) % count) + count) % count
}
