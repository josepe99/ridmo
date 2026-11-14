import { describe, expect, it } from "vitest"
import { formatGuaranies, formatMoney } from "./currency"

describe("formatGuaranies", () => {
  it("formats zero", () => {
    expect(formatGuaranies(0)).toBe("Gs. 0")
  })

  it("keeps small numbers without a separator", () => {
    expect(formatGuaranies(100)).toBe("Gs. 100")
    expect(formatGuaranies(999)).toBe("Gs. 999")
  })

  it("uses es-PY dot thousands separators, including four digit amounts", () => {
    expect(formatGuaranies(1_000)).toBe("Gs. 1.000")
    expect(formatGuaranies(1_234)).toBe("Gs. 1.234")
    expect(formatGuaranies(6_800_000)).toBe("Gs. 6.800.000")
  })

  it("formats very large amounts", () => {
    expect(formatGuaranies(1_234_567_890)).toBe("Gs. 1.234.567.890")
  })

  it("never shows decimals and rounds to the nearest guarani", () => {
    expect(formatGuaranies(1234.4)).toBe("Gs. 1.234")
    expect(formatGuaranies(1234.5)).toBe("Gs. 1.235")
    expect(formatGuaranies(1234.56)).toBe("Gs. 1.235")
  })

  it("does not apply any display rounding to exact amounts", () => {
    expect(formatGuaranies(3_900_001)).toBe("Gs. 3.900.001")
  })

  it("clamps negative amounts to zero", () => {
    expect(formatGuaranies(-1)).toBe("Gs. 0")
    expect(formatGuaranies(-0.4)).toBe("Gs. 0")
    expect(formatGuaranies(-5_000_000)).toBe("Gs. 0")
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "falls back to zero for the non-finite value %s",
    (value) => {
      expect(formatGuaranies(value)).toBe("Gs. 0")
    }
  )
})

describe("formatMoney", () => {
  it("formats PYG as guaranies", () => {
    expect(formatMoney(6_800_000, "PYG")).toBe("Gs. 6.800.000")
    expect(formatMoney(1234.56, "PYG")).toBe("Gs. 1.235")
  })

  it("falls back to the currency code for any other currency", () => {
    expect(formatMoney(1234.5, "USD")).toBe("USD 1.234,5")
    expect(formatMoney(10, "EUR")).toBe("EUR 10")
  })
})
