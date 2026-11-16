/** Site-wide SEO constants. The public origin can be overridden per environment. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.milocompany.store").replace(
  /\/+$/,
  ""
)
export const SITE_NAME = "RIDMO"
export const SITE_LOCALE = "es_PY"
export const SITE_LANGUAGE = "es-PY"
export const SITE_CURRENCY = "PYG"
export const TWITTER_HANDLE = "@milowearcompany"
export const SITE_LOGO_PATH = "/images/ridmo-logo.png"
/** Open Graph image: the square brand logo (500x500, transparent PNG). */
export const SITE_OG_IMAGE = { url: SITE_LOGO_PATH, width: 500, height: 500, alt: "RIDMO - Collares y relojes cubanos" }

export const SITE_TITLE = "RIDMO | Collares y Relojes Cubanos, Lentes Exclusivos en Paraguay"
export const SITE_DESCRIPTION =
  "RIDMO: prendas brillantes de estilo urbano en Paraguay. Collares cubanos, relojes cubanos y lentes exclusivos inspirados en el estilo de Anuel, Bad Bunny y Yovngchimi. Envíos a Asunción, Lambaré, todo el interior del país e internacionales."

/** Indexing policy shared by the layout and the home page. */
export const SITE_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
  },
}

/** Resolves a site path (or an already absolute URL) to an absolute URL. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Paths that must never be crawled or indexed (private, transactional or API). */
export const PRIVATE_PATHS = ["/admin/", "/api/", "/cart", "/profile", "/order/", "/sign-in", "/sign-up"]
