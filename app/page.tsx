import ProductCarousel from "@/components/product-carousel"
import { getCollections } from "@/lib/actions/collections"
import CollectionHero from "@/components/collection-hero"

export default async function HomePage() {
  // Fetch collections with their items
  const collectionsResult = await getCollections({ isActive: true })

  const collections = collectionsResult.success && collectionsResult.data ? collectionsResult.data.data : []

  return (
    <>
      <CollectionHero collections={collections} />

      {/* Map through collections and show ProductCarousel for each */}
      {collections.map((collection: any) => {
        // Get items with first image for each collection
        const itemsWithFirstImage = collection.items?.map((item: any) => ({
          ...item,
          image: item.images?.[0] || null // Get first image or null
        })) || []

        // Only show carousel if collection has items
        if (itemsWithFirstImage.length > 0) {
          return (
            <ProductCarousel 
              key={collection.id}
              title={collection.name} 
              products={itemsWithFirstImage} 
              collectionSlug={collection.slug}
            />
          )
        }
        return null
      })}
    </>
  )
}
