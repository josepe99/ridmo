import { formatMoney } from "@/shared/lib/currency"

const dateFormatter = new Intl.DateTimeFormat("es-PY", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Asuncion",
})

/** Formats an order amount. Orders are stored in PYG, shown as `Gs. 6.800.000`. */
export const formatOrderMoney = formatMoney

export function formatOrderDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}
