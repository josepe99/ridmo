import { describe, expect, it } from "vitest"
import { CORE_KEYWORDS, LOCATION_KEYWORDS, SITE_KEYWORDS, STYLE_KEYWORDS, buildKeywords } from "./keywords"

describe("buildKeywords", () => {
  it("keeps order, trims and drops blanks and case-insensitive duplicates", () => {
    expect(buildKeywords(["  Oro ", "", "RIDMO"], undefined, ["oro", "ridmo", "Plata"])).toEqual([
      "Oro",
      "RIDMO",
      "Plata",
    ])
  })

  it("caps the list at 30 keywords", () => {
    const many = Array.from({ length: 50 }, (_, i) => `k${i}`)

    expect(buildKeywords(many)).toHaveLength(30)
  })
})

describe("site keywords", () => {
  it("covers the brand, product, style and location terms the business targets", () => {
    expect(SITE_KEYWORDS).toEqual(
      expect.arrayContaining([
        ...CORE_KEYWORDS.slice(0, 7),
        "estilo Anuel",
        "estilo Bad Bunny",
        "estilo Yovngchimi",
        "Asunción",
        "Lambaré",
        "interior de Paraguay",
      ])
    )
    expect(STYLE_KEYWORDS.length + LOCATION_KEYWORDS.length).toBeGreaterThan(0)
  })
})
