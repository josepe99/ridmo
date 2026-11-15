import { describe, expect, it } from "vitest"
import {
  DOMESTIC_COUNTRY,
  INTERNATIONAL_SHIPPING_ADMIN_NOTICE,
  INTERNATIONAL_SHIPPING_NOTICE,
  SHIPPING_COUNTRIES,
  SHIPPING_COUNTRY_NAMES,
  isDomesticShipment,
  isShippingCountry,
} from "./shipping-countries"

describe("SHIPPING_COUNTRIES", () => {
  it("starts with Paraguay", () => {
    expect(SHIPPING_COUNTRIES[0]).toEqual({ code: "PY", name: "Paraguay" })
    expect(DOMESTIC_COUNTRY).toBe("Paraguay")
  })

  it("sorts the remaining countries alphabetically by Spanish name", () => {
    const rest = SHIPPING_COUNTRIES.slice(1).map((country) => country.name)
    const sorted = [...rest].sort((a, b) => a.localeCompare(b, "es"))

    expect(rest).toEqual(sorted)
  })

  it("has unique ISO alpha-2 codes and unique names", () => {
    const codes = SHIPPING_COUNTRIES.map((country) => country.code)

    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true)
    expect(new Set(codes).size).toBe(codes.length)
    expect(new Set(SHIPPING_COUNTRY_NAMES).size).toBe(SHIPPING_COUNTRY_NAMES.length)
  })

  it("has trimmed, non-empty names within the schema length limit", () => {
    for (const { name } of SHIPPING_COUNTRIES) {
      expect(name).toBe(name.trim())
      expect(name.length).toBeGreaterThanOrEqual(2)
      expect(name.length).toBeLessThanOrEqual(60)
    }
  })

  it("contains the usual destinations with their Spanish names", () => {
    for (const name of ["Argentina", "Brasil", "Estados Unidos", "España", "Uruguay", "Chile", "Bolivia"]) {
      expect(SHIPPING_COUNTRY_NAMES).toContain(name)
    }
  })

  it("exposes the names in the same order as the entries", () => {
    expect(SHIPPING_COUNTRY_NAMES).toEqual(SHIPPING_COUNTRIES.map((country) => country.name))
  })
})

describe("isShippingCountry", () => {
  it.each(["Paraguay", "Argentina", "Estados Unidos"])("accepts %j", (country) => {
    expect(isShippingCountry(country)).toBe(true)
  })

  it.each([
    "",
    " ",
    "Narnia",
    "paraguay",
    "Paraguay ",
    "AR",
    "<script>alert(1)</script>",
    "Argentina'; DROP TABLE orders;--",
    '{"$ne":null}',
    "Paraguay\u0000",
    "__proto__",
    "constructor",
  ])("rejects %j", (country) => {
    expect(isShippingCountry(country)).toBe(false)
  })

  it.each([null, undefined, 1, {}, ["Paraguay"]])("rejects the non-string %j", (value) => {
    expect(isShippingCountry(value)).toBe(false)
  })
})

describe("isDomesticShipment", () => {
  it("is true for Paraguay", () => {
    expect(isDomesticShipment("Paraguay")).toBe(true)
  })

  it("tolerates case and surrounding spaces from stored data", () => {
    expect(isDomesticShipment(" paraguay ")).toBe(true)
  })

  it.each(["Argentina", "Brasil", "Estados Unidos"])("is false for %j", (country) => {
    expect(isDomesticShipment(country)).toBe(false)
  })

  it.each([null, undefined, ""])("treats missing country %j as domestic (legacy orders)", (country) => {
    expect(isDomesticShipment(country)).toBe(true)
  })
})

describe("international shipping notices", () => {
  it("tell the customer cost and delivery time are coordinated after the order", () => {
    expect(INTERNATIONAL_SHIPPING_NOTICE).toMatch(/costo/i)
    expect(INTERNATIONAL_SHIPPING_NOTICE).toMatch(/plazo/i)
    expect(INTERNATIONAL_SHIPPING_NOTICE).toMatch(/internacional/i)
  })

  it("tell the admin the same, in third person", () => {
    expect(INTERNATIONAL_SHIPPING_ADMIN_NOTICE).toMatch(/costo/i)
    expect(INTERNATIONAL_SHIPPING_ADMIN_NOTICE).toMatch(/plazo/i)
    expect(INTERNATIONAL_SHIPPING_ADMIN_NOTICE).toMatch(/cliente/i)
  })
})
