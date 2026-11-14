import { describe, expect, it } from "vitest"
import { formatOrderNumber, isOrderNumber } from "./order-number"

describe("formatOrderNumber", () => {
  it("pads the sequence to six digits with the RID prefix", () => {
    expect(formatOrderNumber(1)).toBe("RID-000001")
    expect(formatOrderNumber(123)).toBe("RID-000123")
    expect(formatOrderNumber(999999)).toBe("RID-999999")
  })

  it("keeps growing instead of truncating past six digits", () => {
    expect(formatOrderNumber(1234567)).toBe("RID-1234567")
  })

  it.each([0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid sequence %s",
    (seq) => {
      expect(() => formatOrderNumber(seq)).toThrow()
    }
  )
})

describe("isOrderNumber", () => {
  it("accepts well formed order numbers", () => {
    expect(isOrderNumber("RID-000123")).toBe(true)
    expect(isOrderNumber("RID-1234567")).toBe(true)
  })

  it.each(["rid-000123", "RID-12", "RID-00012a", "000123", "", "RID-000123 "])(
    "rejects %j",
    (value) => {
      expect(isOrderNumber(value)).toBe(false)
    }
  )
})
