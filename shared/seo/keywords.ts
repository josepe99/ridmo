/** Core brand and product terms the business wants to rank for. */
export const CORE_KEYWORDS = [
  "RIDMO",
  "collares cubanos",
  "collares cubanas",
  "relojes cubanos",
  "relojes cubanas",
  "cadenas cubanas",
  "lentes exclusivos",
  "prendas brillantes",
  "joyería urbana",
  "estilo urbano",
]

/** Style references (inspiration only, not an endorsement claim). */
export const STYLE_KEYWORDS = [
  "estilo Anuel",
  "estilo Bad Bunny",
  "estilo Yovngchimi",
  "joyas trap",
  "joyas hip hop",
]

/** Where the store sells and ships. */
export const LOCATION_KEYWORDS = [
  "Paraguay",
  "Asunción",
  "Lambaré",
  "interior de Paraguay",
  "envíos a todo Paraguay",
  "envíos internacionales",
  "comprar online Paraguay",
]

const MAX_KEYWORDS = 30

/** Merges keyword groups in order, dropping blanks and case-insensitive duplicates. */
export function buildKeywords(...groups: Array<readonly string[] | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const group of groups) {
    for (const raw of group ?? []) {
      const keyword = raw.trim()
      const key = keyword.toLowerCase()
      if (!keyword || seen.has(key)) continue
      seen.add(key)
      result.push(keyword)
      if (result.length >= MAX_KEYWORDS) return result
    }
  }

  return result
}

/** Site-wide keywords: core terms, style references and locations. */
export const SITE_KEYWORDS = buildKeywords(CORE_KEYWORDS, STYLE_KEYWORDS, LOCATION_KEYWORDS)
