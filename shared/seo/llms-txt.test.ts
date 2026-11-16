import { describe, expect, it } from "vitest"
import { buildLlmsTxt } from "./llms-txt"

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt(
    [{ name: "Cadenas", slug: "cadenas", description: "Cadenas\nmacizas" }],
    [
      {
        name: "Cadena Milan",
        slug: "cadena-milan",
        collectionSlug: "cadenas",
        description: "x".repeat(300),
        price: 3_900_000,
      },
      { name: "Reloj", slug: "reloj", collectionSlug: "relojes", description: null, price: 100 },
    ]
  )

  it("follows the llms.txt layout: title, summary and sections", () => {
    expect(text.startsWith("# RIDMO\n\n> ")).toBe(true)
    expect(text).toContain("## Colecciones")
    expect(text).toContain("## Productos")
  })

  it("links collections and products with absolute URLs and one-line details", () => {
    expect(text).toContain("- [Cadenas](https://www.milocompany.store/cadenas): Cadenas macizas")
    expect(text).toContain("https://www.milocompany.store/cadenas/cadena-milan")
    expect(text).toMatch(/\[Reloj\]\(https:\/\/www\.milocompany\.store\/relojes\/reloj\): Gs\. 100$/m)
  })

  it("truncates long product descriptions", () => {
    const line = text.split("\n").find((l) => l.includes("Cadena Milan")) as string

    expect(line).toContain("…")
    expect(line.length).toBeLessThan(300)
  })
})
