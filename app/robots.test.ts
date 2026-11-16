import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/catalog/server", () => ({ getSeoCatalog: vi.fn() }))

import { getSeoCatalog } from "@/modules/catalog/server"
import robots from "./robots"
import sitemap from "./sitemap"

describe("robots", () => {
  it("allows crawling, hides private paths and points to the sitemap", () => {
    const result = robots()
    const rules = result.rules as Array<{ userAgent: string | string[]; disallow: string[] }>

    expect(rules[0]).toMatchObject({ userAgent: "*", allow: "/" })
    expect(rules[0].disallow).toEqual(expect.arrayContaining(["/admin/", "/api/", "/cart"]))
    expect(result.sitemap).toBe("https://www.milocompany.store/sitemap.xml")
  })

  it("names the AI crawlers explicitly and lets them read llms.txt", () => {
    const aiRule = (robots().rules as Array<{ userAgent: string[]; allow: string[] }>)[1]

    expect(aiRule.userAgent).toEqual(expect.arrayContaining(["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]))
    expect(aiRule.allow).toContain("/llms.txt")
  })
})

describe("sitemap", () => {
  it("lists the home, every collection and every product", async () => {
    const updatedAt = new Date("2026-01-01")
    vi.mocked(getSeoCatalog).mockResolvedValue({
      collections: [{ name: "Cadenas", slug: "cadenas", description: null, updatedAt }],
      products: [
        { name: "A", slug: "a", description: null, price: 1, collectionSlug: "cadenas", updatedAt },
      ],
    })

    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toEqual([
      "https://www.milocompany.store/",
      "https://www.milocompany.store/cadenas",
      "https://www.milocompany.store/cadenas/a",
    ])
  })
})
