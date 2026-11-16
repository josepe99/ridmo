import { ProductsGrid, CollectionHero } from "@/modules/catalog";
import { getActiveCollectionsWithProducts } from "@/modules/catalog/server";
import { Suspense } from "react";
import { Metadata } from "next";
import { SITE_KEYWORDS, buildKeywords } from "@/shared/seo/keywords";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_ROBOTS,
  SITE_TITLE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/shared/seo/site";

// Enable ISR with 60-second revalidation instead of force-dynamic
export const revalidate = 60;

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: buildKeywords(SITE_KEYWORDS, [
    "cuban link chain Paraguay",
    "cadenas gruesas",
    "cadenas doradas",
    "cadenas plateadas",
    "accesorios urbanos",
    "joyería masculina",
  ]),
  robots: SITE_ROBOTS,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
    creator: TWITTER_HANDLE,
  },
  alternates: {
    canonical: SITE_URL,
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
  const collections = await getActiveCollectionsWithProducts();

  return (
    <>
      <CollectionHero collections={collections} />

      {/* Map through collections and show ProductCarousel for each */}
      {collections.map((collection) => {
        // Only show the grid if the collection has products
        if (collection.products.length > 0) {
          return (
            <div key={collection.id} className="mt-10">
              <ProductsGrid
                title={collection.name}
                products={collection.products}
                collectionSlug={collection.slug}
              />
            </div>
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
