import { Suspense } from "react";
import ProductCarousel from "@/components/product-carousel";
import { getCollections } from "@/lib/actions/collections";
import CollectionHero from "@/components/collection-hero";
import { Metadata } from "next";

// Enable ISR with 60-second revalidation instead of force-dynamic
export const revalidate = 60;

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

// Loading skeleton for hero section
function HeroSkeleton() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-200 animate-pulse">
      <div className="absolute inset-0 flex flex-col items-start justify-center px-4 md:px-12 lg:px-24">
        <div className="h-12 md:h-16 w-3/4 bg-gray-300 rounded mb-4" />
        <div className="h-6 w-1/2 bg-gray-300 rounded mb-8" />
        <div className="h-12 w-32 bg-gray-300 rounded" />
      </div>
    </section>
  );
}

// Loading skeleton for carousel section
function CarouselSkeleton() {
  return (
    <section className="w-full py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="px-4 md:px-6">
        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-12 animate-pulse" />
        <div className="flex gap-8 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-[240px] lg:w-[260px]">
              <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse rounded" />
              <div className="mt-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Async component for collections content
async function CollectionsContent() {
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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <>
          <HeroSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
        </>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
