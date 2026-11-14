import { describe, expect, it } from "vitest"
import { formatOrderDate, formatOrderMoney } from "./format"

describe("formatOrderMoney", () => {
  it("formats guaranies with the Gs. prefix and dot thousands separators", () => {
    expect(formatOrderMoney(6_800_000, "PYG")).toBe("Gs. 6.800.000")
  })

  it("drops decimals for guaranies", () => {
    expect(formatOrderMoney(1234.56, "PYG")).toBe("Gs. 1.235")
  })

  it("formats other currencies with their code and up to two decimals", () => {
    expect(formatOrderMoney(1234.5, "USD")).toBe("USD 1.234,5")
    expect(formatOrderMoney(10, "EUR")).toBe("EUR 10")
  })

  it("formats zero", () => {
    expect(formatOrderMoney(0, "PYG")).toBe("Gs. 0")
  })
})

describe("formatOrderDate", () => {
  it("renders the instant in the Asuncion timezone", () => {
    // 2026-01-15T12:00Z is 09:00 in Asuncion (UTC-3 in January).
    const formatted = formatOrderDate("2026-01-15T12:00:00.000Z")

    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/9:00|09:00/)
  })

  it("uses the previous calendar day when UTC is past midnight but Asuncion is not", () => {
    const formatted = formatOrderDate("2026-01-15T01:30:00.000Z")

    expect(formatted).toMatch(/14/)
  })
})
