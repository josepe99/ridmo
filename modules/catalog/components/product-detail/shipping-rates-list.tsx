import { Plus } from "lucide-react"
import { getShippingRateRows } from "@/modules/orders"
import { formatGuaranies } from "@/shared/lib/currency"

const SHIPPING_RATES = getShippingRateRows()

/** Public price list text: "Gs. 20.000", or "A cotizar" for rows the shop quotes case by case. */
const rateCost = (cost: number | null) => (cost === null ? "A cotizar" : formatGuaranies(cost))

export default function ShippingRatesList() {
  return (
    <details>
      <summary className="flex cursor-pointer items-center gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" />
        Costos de envío
      </summary>
      <ul className="mt-3 space-y-3 text-sm text-neutral-600">
        {SHIPPING_RATES.map((rate) => (
          <li key={rate.id} className="flex items-start justify-between gap-4">
            <span>
              {rate.zone}
              {rate.note && <span className="block text-xs text-neutral-500">{rate.note}</span>}
            </span>
            <span className="shrink-0 font-medium text-neutral-900">{rateCost(rate.cost)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
