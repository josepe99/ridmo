import "server-only"

// Server-only public API of the catalog module.
// The client-safe API (components + types) lives in ./index.ts.
export {
  getActiveCollectionLinks,
  getActiveCollectionsWithProducts,
  getCollectionBySlug,
  getProductsByCollectionSlug,
} from "./services/collections"
export { getProductBySlug } from "./services/products"
export { getSeoCatalog } from "./services/seo-catalog"
