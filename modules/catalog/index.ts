// Client-safe public API of the catalog module (components + types).
// Server-only data access is exposed through ./server.ts.
export { default as Price } from "./components/price"
export { default as CatalogBreadcrumb } from "./components/catalog-breadcrumb"
export { default as ProductGallery } from "./components/product-gallery/product-gallery"
export { default as ProductDetailView } from "./components/product-detail/product-detail-view"
export { buildProductMetadata } from "./utils/product-metadata"
export { default as CollectionHero } from "./components/collection-hero"
export { default as ProductsGrid } from "./components/home-grid/products-grid"
export type {
  ProductSummary,
  ProductDetail,
  CollectionSummary,
  CollectionLink,
  CollectionWithProducts,
} from "./types"
