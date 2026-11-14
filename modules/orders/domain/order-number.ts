/** Prefix shared by every human friendly order number. */
export const ORDER_NUMBER_PREFIX = "RID"

const ORDER_NUMBER_PATTERN = /^RID-\d{6,}$/

/**
 * Formats an atomic sequence value as a human friendly order number
 * (`1` -> `RID-000001`). Sequences past six digits simply grow longer.
 */
export function formatOrderNumber(sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error(`Order sequence must be a positive integer, got ${sequence}`)
  }
  return `${ORDER_NUMBER_PREFIX}-${String(sequence).padStart(6, "0")}`
}

/** True when the value looks like an order number produced by `formatOrderNumber`. */
export function isOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value)
}
