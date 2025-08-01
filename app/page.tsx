import ProductCarousel from "@/components/product-carousel"
import { getCollections } from "@/lib/actions/collections"
import CollectionHero from "@/components/collection-hero"
import { getItems } from "@/lib/actions/items"

export default async function HomePage() {
  // Fetch data on the server
  const [itemsResult, collectionsResult] = await Promise.all([
    getItems({ limit: 10, isActive: true }),
    getCollections(),
  ])

  const items = itemsResult.success && itemsResult.data ? itemsResult.data.data : []
  const collections = collectionsResult.success && collectionsResult.data ? collectionsResult.data.data : []

  return (
    <>
      <CollectionHero collections={collections} />

      {/* Sección de Novedades usando ProductCarousel */}
      <ProductCarousel title="Novedades" products={items.slice(0, 5)} />
    </>
  )
}
