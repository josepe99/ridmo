import { describe, expect, it } from "vitest"
import {
  CITY_SHIPPING_OPTIONS,
  INTERIOR_SHIPPING_OPTIONS,
  INTERNATIONAL_SHIPPING_ETA,
  SHIPPING_OPTIONS,
  calculateShippingCost,
  getShippingOption,
  getShippingRateRows,
} from "./paraguay-shipping"

/** Business source of truth (Gs.): city -> cost. `Luque 1` and `Luque 2` are priced apart. */
const CITY_RATES: ReadonlyArray<readonly [id: string, label: string, city: string, cost: number]> = [
  ["lambare", "Lambaré", "Lambaré", 15_000],
  ["asuncion", "Asunción", "Asunción", 20_000],
  ["villa-elisa", "Villa Elisa", "Villa Elisa", 20_000],
  ["fernando-de-la-mora", "Fernando de la Mora", "Fernando de la Mora", 20_000],
  ["san-lorenzo", "San Lorenzo", "San Lorenzo", 30_000],
  ["luque-1", "Luque 1", "Luque", 30_000],
  ["nemby", "Ñemby", "Ñemby", 30_000],
  ["san-antonio", "San Antonio", "San Antonio", 30_000],
  ["mariano-roque-alonso", "Mariano Roque Alonso", "Mariano Roque Alonso", 30_000],
  ["chacoi", "Chaco'i", "Chaco'i", 30_000],
  ["capiata", "Capiatá", "Capiatá", 35_000],
  ["luque-2", "Luque 2", "Luque", 35_000],
  ["limpio", "Limpio", "Limpio", 40_000],
  ["remansito", "Remansito", "Remansito", 40_000],
  ["j-augusto-saldivar", "J. Augusto Saldívar", "J. Augusto Saldívar", 40_000],
  ["aregua", "Areguá", "Areguá", 40_000],
  ["ypane", "Ypané", "Ypané", 40_000],
  ["itaugua", "Itauguá", "Itauguá", 45_000],
  ["guarambare", "Guarambaré", "Guarambaré", 45_000],
  ["villeta", "Villeta (centro y zona urbana)", "Villeta", 45_000],
  ["villa-hayes", "Villa Hayes", "Villa Hayes", 55_000],
  ["ita", "Itá", "Itá", 55_000],
  ["ypacarai", "Ypacaraí (centro)", "Ypacaraí", 55_000],
]

describe("shipping options catalog", () => {
  it("has one option per city of the business table, priced as agreed", () => {
    expect(CITY_SHIPPING_OPTIONS).toHaveLength(CITY_RATES.length)
    for (const [id, label, city, cost] of CITY_RATES) {
      expect(getShippingOption(id)).toMatchObject({ id, kind: "city", label, city, cost })
    }
  })

  it("prices Luque by zone with two distinct entries", () => {
    expect(getShippingOption("luque-1")).toMatchObject({ cost: 30_000, city: "Luque" })
    expect(getShippingOption("luque-2")).toMatchObject({ cost: 35_000, city: "Luque" })
    expect(getShippingOption("luque-1")?.label).not.toBe(getShippingOption("luque-2")?.label)
  })

  it("offers the two interior delivery types, both arriving in one day", () => {
    expect(INTERIOR_SHIPPING_OPTIONS.map((option) => option.id)).toEqual(["interior", "interior-door"])
    expect(getShippingOption("interior")).toMatchObject({
      kind: "interior",
      label: "Interior del país",
      cost: 30_000,
      eta: "Llega en 1 día",
    })
    expect(getShippingOption("interior-door")).toMatchObject({
      kind: "interior",
      label: "Interior del país, entrega en puerta",
      cost: 35_000,
      eta: "Llega en 1 día",
    })
  })

  it("lists every option once, with unique ids and a positive whole cost", () => {
    const ids = SHIPPING_OPTIONS.map((option) => option.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(SHIPPING_OPTIONS).toHaveLength(CITY_SHIPPING_OPTIONS.length + INTERIOR_SHIPPING_OPTIONS.length)
    for (const option of SHIPPING_OPTIONS) {
      expect(Number.isInteger(option.cost) && option.cost > 0).toBe(true)
      expect(option.label.length).toBeGreaterThan(0)
    }
  })
})

describe("getShippingOption", () => {
  it("returns null for anything that is not an exact option id", () => {
    for (const value of [
      "",
      " asuncion",
      "ASUNCION",
      "asunción",
      "unknown",
      "__proto__",
      "constructor",
      "toString",
      null,
      undefined,
      1,
      {},
      ["asuncion"],
      { $ne: "x" },
    ]) {
      expect(getShippingOption(value)).toBeNull()
    }
  })
})

describe("calculateShippingCost", () => {
  it.each(CITY_RATES)("charges the agreed cost for %s (%s)", (id, _label, _city, cost) => {
    expect(calculateShippingCost({ country: "Paraguay", optionId: id })).toMatchObject({ ok: true, cost })
  })

  it("charges the interior pickup and door delivery prices", () => {
    expect(calculateShippingCost({ country: "Paraguay", optionId: "interior" })).toMatchObject({
      ok: true,
      cost: 30_000,
    })
    expect(calculateShippingCost({ country: "Paraguay", optionId: "interior-door" })).toMatchObject({
      ok: true,
      cost: 35_000,
    })
  })

  it("returns the resolved option for domestic orders so callers can snapshot its label", () => {
    const result = calculateShippingCost({ country: "Paraguay", optionId: "villeta" })

    expect(result).toEqual({ ok: true, cost: 45_000, option: getShippingOption("villeta") })
  })

  it("requires a valid option for a domestic destination", () => {
    for (const optionId of [undefined, null, "", "nope", "ASUNCION", "__proto__", 20_000, {}, ["asuncion"]]) {
      expect(calculateShippingCost({ country: "Paraguay", optionId })).toEqual({
        ok: false,
        code: "INVALID_SHIPPING_OPTION",
      })
    }
  })

  it("treats a missing or empty country (legacy data) as domestic", () => {
    expect(calculateShippingCost({ country: "", optionId: "asuncion" })).toMatchObject({ ok: true, cost: 20_000 })
    expect(calculateShippingCost({ country: undefined, optionId: undefined })).toEqual({
      ok: false,
      code: "INVALID_SHIPPING_OPTION",
    })
  })

  it("does not compute a cost for international destinations and ignores the option", () => {
    for (const optionId of [undefined, "", "asuncion", "interior-door", "tampered", 5, {}]) {
      expect(calculateShippingCost({ country: "Argentina", optionId })).toEqual({ ok: true, cost: 0, option: null })
    }
  })

  it("never lets a tampered option id lower or change the price of a domestic order", () => {
    const cheapest = Math.min(...SHIPPING_OPTIONS.map((option) => option.cost))
    for (const optionId of ["asuncion ", "0", "-1", "lambare\u0000", "lambare;drop", "Lambaré"]) {
      const result = calculateShippingCost({ country: "Paraguay", optionId })
      expect(result.ok).toBe(false)
      if (result.ok) expect(result.cost).toBeGreaterThanOrEqual(cheapest)
    }
  })
})

describe("getShippingRateRows", () => {
  const rows = getShippingRateRows()

  it("groups the cities that share a price, in the order shown on the product page", () => {
    expect(rows.slice(0, 8).map((row) => [row.zone, row.cost])).toEqual([
      ["Asunción, Villa Elisa, Fernando de la Mora", 20_000],
      ["Lambaré", 15_000],
      ["San Lorenzo, Luque 1, Ñemby, San Antonio, Mariano Roque Alonso, Chaco'i", 30_000],
      ["Capiatá, Luque 2", 35_000],
      ["Limpio, Remansito, J. Augusto Saldívar, Areguá, Ypané", 40_000],
      ["Itauguá, Guarambaré, Villeta (centro y zona urbana)", 45_000],
      ["Villa Hayes, Itá, Ypacaraí (centro)", 55_000],
      ["Interior del país", 30_000],
    ])
  })

  it("adds the interior door delivery and the international row", () => {
    expect(rows[7]).toMatchObject({ zone: "Interior del país", note: "Llega en 1 día" })
    expect(rows[8]).toEqual({
      id: "interior-door",
      zone: "Interior del país, entrega en puerta",
      cost: 35_000,
      note: "Llega en 1 día",
    })
    expect(rows[9]).toEqual({
      id: "international",
      zone: "Internacional (DHL)",
      cost: null,
      note: `Según país y peso. ${INTERNATIONAL_SHIPPING_ETA}`,
    })
    expect(rows).toHaveLength(10)
  })

  it("covers every city option exactly once", () => {
    const text = rows.map((row) => row.zone).join(", ")
    for (const option of CITY_SHIPPING_OPTIONS) {
      expect(text.split(option.label).length - 1).toBe(1)
    }
  })

  it("derives every price from the same options used to charge", () => {
    for (const row of rows) {
      if (row.cost === null) continue
      expect(SHIPPING_OPTIONS.some((option) => option.cost === row.cost)).toBe(true)
    }
  })
})
