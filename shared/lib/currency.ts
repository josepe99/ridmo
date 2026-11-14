const guaraniFormatter = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 })
const fallbackFormatter = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 })

/**
 * The single price formatter of the storefront: whole guaranies, `es-PY` separators, `Gs.` prefix
 * (e.g. `Gs. 6.800.000`). Prices are never converted or rounded for display, only to a whole guarani.
 * Negative and non-finite amounts are not valid prices and render as `Gs. 0`.
 */
export function formatGuaranies(amount: number): string {
  const whole = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0
  return `Gs. ${guaraniFormatter.format(whole)}`
}

/** Formats a stored order amount. Orders are always PYG; any other code is shown verbatim. */
export function formatMoney(amount: number, currency: string): string {
  if (currency === "PYG") return formatGuaranies(amount)
  return `${currency} ${fallbackFormatter.format(amount)}`
}
