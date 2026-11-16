import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./site"

export type LlmsCollection = { name: string; slug: string; description: string | null }
export type LlmsProduct = {
  name: string
  slug: string
  collectionSlug: string
  description: string | null
  price: number
}

const SUMMARY_MAX_LENGTH = 140

function oneLine(text: string | null, max = SUMMARY_MAX_LENGTH): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

function entry(title: string, url: string, detail: string): string {
  return detail ? `- [${title}](${url}): ${detail}` : `- [${title}](${url})`
}

/** Builds /llms.txt (llmstxt.org format) so AI assistants can understand the store. */
export function buildLlmsTxt(collections: LlmsCollection[], products: LlmsProduct[]): string {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "RIDMO es una tienda online paraguaya de prendas brillantes y accesorios de estilo urbano: collares cubanos, relojes cubanos y lentes exclusivos. Precios en guaraníes (PYG). Se vende online con entrega en Asunción, Lambaré, el interior de Paraguay y envíos internacionales.",
    "",
    "## Colecciones",
    "",
    ...collections.map((collection) =>
      entry(collection.name, absoluteUrl(`/${collection.slug}`), oneLine(collection.description))
    ),
    "",
    "## Productos",
    "",
    ...products.map((product) => {
      const price = `Gs. ${Math.round(product.price).toLocaleString("es-PY")}`
      const detail = [price, oneLine(product.description)].filter(Boolean).join(" · ")
      return entry(product.name, absoluteUrl(`/${product.collectionSlug}/${product.slug}`), detail)
    }),
    "",
    "## Información",
    "",
    entry("Sitemap", `${SITE_URL}/sitemap.xml`, "Todas las páginas indexables"),
    "",
  ]

  return lines.join("\n")
}
