import { isDomesticShipment } from "./shipping-countries"

/**
 * Paraguay shipping model (guaranies). Single source of truth for what the shopper picks in
 * checkout, what the server charges and what the product page lists.
 *
 * Pure and client-safe: the server recomputes the cost from the option id, a cost is never
 * accepted from the caller.
 */

export type ShippingOption = {
  /** Stable identifier stored in the order and sent by the checkout form. Never reused or renamed. */
  id: string
  /** `city`: a Gran Asunción area city with its own rate. `interior`: any other Paraguayan city. */
  kind: "city" | "interior"
  /** Text shown to the shopper and snapshotted in the order. */
  label: string
  /** Cost in guaranies. */
  cost: number
  /** City name written to the order for `city` options (the server does not trust the typed one). */
  city?: string
  /** Delivery time. */
  eta?: string
  /** Extra explanation of how the delivery works. */
  description?: string
}

export type ShippingFailure = { ok: false; code: "INVALID_SHIPPING_OPTION" }

export type ShippingCostResult =
  | {
      ok: true
      /** Whole guaranies; `0` for international orders (quoted later). */
      cost: number
      /** The chosen option, or `null` for international orders. */
      option: ShippingOption | null
    }
  | ShippingFailure

/** One row of the public price list (product page). `cost: null` means "to be quoted". */
export type ShippingRateRow = {
  id: string
  zone: string
  cost: number | null
  note?: string
}

export const INTERNATIONAL_SHIPPING_ETA = "Llega en 5 días aproximadamente"

const INTERIOR_ETA = "Llega en 1 día"

type CityEntry = { id: string; label: string; city: string }

/** Gran Asunción rates grouped by price, in the order they are listed to the public. */
const CITY_RATE_GROUPS: ReadonlyArray<{ cost: number; cities: ReadonlyArray<CityEntry> }> = [
  {
    cost: 20_000,
    cities: [
      { id: "asuncion", label: "Asunción", city: "Asunción" },
      { id: "villa-elisa", label: "Villa Elisa", city: "Villa Elisa" },
      { id: "fernando-de-la-mora", label: "Fernando de la Mora", city: "Fernando de la Mora" },
    ],
  },
  { cost: 15_000, cities: [{ id: "lambare", label: "Lambaré", city: "Lambaré" }] },
  {
    cost: 30_000,
    cities: [
      { id: "san-lorenzo", label: "San Lorenzo", city: "San Lorenzo" },
      { id: "luque-1", label: "Luque 1", city: "Luque" },
      { id: "nemby", label: "Ñemby", city: "Ñemby" },
      { id: "san-antonio", label: "San Antonio", city: "San Antonio" },
      { id: "mariano-roque-alonso", label: "Mariano Roque Alonso", city: "Mariano Roque Alonso" },
      { id: "chacoi", label: "Chaco'i", city: "Chaco'i" },
    ],
  },
  {
    cost: 35_000,
    cities: [
      { id: "capiata", label: "Capiatá", city: "Capiatá" },
      { id: "luque-2", label: "Luque 2", city: "Luque" },
    ],
  },
  {
    cost: 40_000,
    cities: [
      { id: "limpio", label: "Limpio", city: "Limpio" },
      { id: "remansito", label: "Remansito", city: "Remansito" },
      { id: "j-augusto-saldivar", label: "J. Augusto Saldívar", city: "J. Augusto Saldívar" },
      { id: "aregua", label: "Areguá", city: "Areguá" },
      { id: "ypane", label: "Ypané", city: "Ypané" },
    ],
  },
  {
    cost: 45_000,
    cities: [
      { id: "itaugua", label: "Itauguá", city: "Itauguá" },
      { id: "guarambare", label: "Guarambaré", city: "Guarambaré" },
      { id: "villeta", label: "Villeta (centro y zona urbana)", city: "Villeta" },
    ],
  },
  {
    cost: 55_000,
    cities: [
      { id: "villa-hayes", label: "Villa Hayes", city: "Villa Hayes" },
      { id: "ita", label: "Itá", city: "Itá" },
      { id: "ypacarai", label: "Ypacaraí (centro)", city: "Ypacaraí" },
    ],
  },
]

export const CITY_SHIPPING_OPTIONS: ReadonlyArray<ShippingOption> = CITY_RATE_GROUPS.flatMap((group) =>
  group.cities.map(
    (entry): ShippingOption => ({
      id: entry.id,
      kind: "city",
      label: entry.label,
      city: entry.city,
      cost: group.cost,
    })
  )
)

/** Any other Paraguayan city: the shopper types the city and picks how the parcel is delivered. */
export const INTERIOR_SHIPPING_OPTIONS: ReadonlyArray<ShippingOption> = [
  {
    id: "interior",
    kind: "interior",
    label: "Interior del país",
    cost: 30_000,
    eta: INTERIOR_ETA,
    description: "Retiro en la sucursal de la transportadora.",
  },
  {
    id: "interior-door",
    kind: "interior",
    label: "Interior del país, entrega en puerta",
    cost: 35_000,
    eta: INTERIOR_ETA,
    description: "Entrega en la puerta de tu domicilio.",
  },
]

/** Every domestic option, in the order offered to the shopper. */
export const SHIPPING_OPTIONS: ReadonlyArray<ShippingOption> = [
  ...CITY_SHIPPING_OPTIONS,
  ...INTERIOR_SHIPPING_OPTIONS,
]

const OPTIONS_BY_ID: ReadonlyMap<string, ShippingOption> = new Map(
  SHIPPING_OPTIONS.map((option) => [option.id, option])
)

/** Exact-match lookup. Anything that is not a known option id (wrong type, casing, spaces) is `null`. */
export function getShippingOption(id: unknown): ShippingOption | null {
  return typeof id === "string" ? (OPTIONS_BY_ID.get(id) ?? null) : null
}

/**
 * Shipping cost of an order, decided only by destination country and chosen option.
 *
 * - Paraguay (or a legacy empty country): the option id must be valid, otherwise `INVALID_SHIPPING_OPTION`.
 * - Any other country: cost `0` (quoted and coordinated after the order) and the option id is ignored.
 */
export function calculateShippingCost(input: {
  country: string | null | undefined
  optionId: unknown
}): ShippingCostResult {
  if (!isDomesticShipment(input.country)) return { ok: true, cost: 0, option: null }

  const option = getShippingOption(input.optionId)
  if (!option) return { ok: false, code: "INVALID_SHIPPING_OPTION" }
  return { ok: true, cost: option.cost, option }
}

/** Price list shown to the public: cities that share a price on one row, interior types and international. */
export function getShippingRateRows(): ShippingRateRow[] {
  const cityRows = CITY_RATE_GROUPS.map(
    (group): ShippingRateRow => ({
      id: `cities-${group.cost}`,
      zone: group.cities.map((entry) => entry.label).join(", "),
      cost: group.cost,
    })
  )
  const interiorRows = INTERIOR_SHIPPING_OPTIONS.map(
    (option): ShippingRateRow => ({
      id: option.id,
      zone: option.label,
      cost: option.cost,
      ...(option.eta ? { note: option.eta } : {}),
    })
  )

  return [
    ...cityRows,
    ...interiorRows,
    {
      id: "international",
      zone: "Internacional (DHL)",
      cost: null,
      note: `Según país y peso. ${INTERNATIONAL_SHIPPING_ETA}`,
    },
  ]
}
