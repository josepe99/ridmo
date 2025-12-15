import ProductCarousel from "@/components/product-carousel";
import { getCollections } from "@/lib/actions/collections";
import CollectionHero from "@/components/collection-hero";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "RIDMO - Joyería y Cadenas Cubanas en Paraguay | Joyas Exclusivas",
  description:
    "Descubre la mejor joyería y cadenas cubanas en Paraguay. RIDMO ofrece colecciones exclusivas de joyas, cadenas cubanas, collares y accesorios de alta calidad. Estilo y elegancia para destacar.",
  keywords: [
    "joyería Paraguay",
    "cadenas cubanas Paraguay",
    "collares cubanos Paraguay",
    "joyas Paraguay",
    
    "accesorios Paraguay",
    "cadenas de oro Paraguay",
    "joyería urbana Paraguay",
    "cadenas hip hop Paraguay",
    "collares Paraguay",
    "bisutería Paraguay",
    "joyas exclusivas Paraguay",
    "cadenas gruesas Paraguay",
    "RIDMO",
    "tienda joyería online Paraguay",
    "cadenas plateadas Paraguay",
    "cadenas doradas Paraguay",
    "accesorios urbanos Paraguay",
    "joyería masculina Paraguay",
    "cuban link chain Paraguay",
  ].join(", "),
  authors: [{ name: "RIDMO" }],
  creator: "RIDMO",
  publisher: "RIDMO",
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
    url: "https://www.ridmo.com.py",
    siteName: "RIDMO",
    title: "RIDMO - Joyería y Cadenas Cubanas en Paraguay",
    description:
      "Descubre la mejor joyería y cadenas cubanas en Paraguay. Colecciones exclusivas de joyas, cadenas cubanas, collares y accesorios de alta calidad.",
    images: [
      {
        url: "/images/milo-logo.png",
        width: 1200,
        height: 630,
        alt: "RIDMO - Joyería y Cadenas Cubanas Paraguay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RIDMO - Joyería y Cadenas Cubanas en Paraguay",
    description:
      "Descubre la mejor joyería y cadenas cubanas en Paraguay. Colecciones exclusivas de joyas, cadenas cubanas, collares y accesorios de alta calidad.",
    images: ["/images/milo-logo.png"],
    creator: "@milowearcompany",
  },
  alternates: {
    canonical: "https://www.milocompany.store",
  },
  other: {
    "geo.region": "PY",
    "geo.placename": "Paraguay",
    ICBM: "-25.2637, -57.5759", // Coordenadas de Asunción
  },
};

export default async function HomePage() {
  // Fetch collections with their items
  const collectionsResult = await getCollections({ isActive: true });

  const collections =
    collectionsResult.success && collectionsResult.data
      ? collectionsResult.data.data
      : [];

  return (
    <>
      <CollectionHero collections={collections} />

      {/* Map through collections and show ProductCarousel for each */}
      {collections.map((collection: any) => {
        // Get items with first image for each collection
        const itemsWithFirstImage =
          collection.items?.map((item: any) => ({
            ...item,
            image: item.images?.[0] || null, // Get first image or null
          })) || [];

        // Only show carousel if collection has items
        if (itemsWithFirstImage.length > 0) {
          return (
            <ProductCarousel
              key={collection.id}
              title={collection.name}
              products={itemsWithFirstImage}
              collectionSlug={collection.slug}
            />
          );
        }
        return null;
      })}
    </>
  );
}
