export const dynamic = "force-dynamic"
import ProductCarousel from "@/components/product-carousel"
import { getCollections } from "@/lib/actions/collections"
import CollectionHero from "@/components/collection-hero"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Milo Wear Company - Ropa Urbana y Streetwear en Paraguay | Moda Urbana Exclusiva",
  description: "Descubre la mejor ropa urbana y streetwear en Paraguay. Milo Wear Company ofrece colecciones exclusivas de moda urbana, casual y lifestyle. Estilo urbano auténtico para jóvenes paraguayos.",
  keywords: [
    "ropa urbana Paraguay",
    "streetwear Paraguay",
    "moda urbana Paraguay",
    "ropa casual Paraguay",
    "lifestyle Paraguay",
    "urban wear Paraguay",
    "moda joven Paraguay",
    "ropa hip hop Paraguay",
    "estilo urbano Paraguay",
    "street fashion Paraguay",
    "ropa deportiva casual",
    "urban style",
    "Milo Wear Company",
    "tienda ropa urbana online Paraguay",
    "oversized Paraguay",
    "hoodie Paraguay",
    "sudaderas Paraguay"
  ].join(", "),
  authors: [{ name: "Milo Wear Company" }],
  creator: "Milo Wear Company",
  publisher: "Milo Wear Company",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "https://www.milocompany.store",
    siteName: "Milo Wear Company",
    title: "Milo Wear Company - Ropa Urbana y Streetwear en Paraguay",
    description: "Descubre la mejor ropa urbana y streetwear en Paraguay. Colecciones exclusivas de moda urbana, casual y lifestyle para jóvenes paraguayos.",
    images: [
      {
        url: "/images/milo-logo.png",
        width: 1200,
        height: 630,
        alt: "Milo Wear Company - Ropa Urbana Paraguay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Milo Wear Company - Ropa Urbana y Streetwear en Paraguay",
    description: "Descubre la mejor ropa urbana y streetwear en Paraguay. Colecciones exclusivas de moda urbana, casual y lifestyle para jóvenes paraguayos.",
    images: ["/images/milo-logo.png"],
    creator: "@milowearcompany",
  },
  alternates: {
    canonical: "https://www.milocompany.store",
  },
  other: {
    "geo.region": "PY",
    "geo.placename": "Paraguay",
    "ICBM": "-25.2637, -57.5759", // Coordenadas de Asunción
  },
}

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
