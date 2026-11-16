import { Metadata } from "next"
import { getCollectionBySlug, getProductsByCollectionSlug } from "@/modules/catalog/server"
import { JsonLd } from "@/shared/seo/json-ld"
import { CORE_KEYWORDS, LOCATION_KEYWORDS, STYLE_KEYWORDS, buildKeywords } from "@/shared/seo/keywords"
import { breadcrumbSchema, collectionSchema } from "@/shared/seo/schemas"
import { SITE_LOCALE, SITE_NAME, TWITTER_HANDLE, absoluteUrl } from "@/shared/seo/site"

type CollectionParams = {
  collectionSlug: string
}
// Metadata dinámico para SEO y Open Graph de la colección
export async function generateMetadata(
  { params }: { params?: CollectionParams | Promise<CollectionParams> } = {}
): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  const collectionSlug = resolvedParams?.collectionSlug
  if (!collectionSlug) return {}
  try {
    const collection = await getCollectionBySlug(collectionSlug);
    if (!collection) return {};
    const title = `${collection.name} | RIDMO`;
    const description = collection.description?.slice(0, 160) || `Descubre la colección ${collection.name} en RIDMO.`;
    const imageUrl = collection.imageUrl || "/images/ridmo-logo.png";
    const url = absoluteUrl(`/${collection.slug}`);
    return {
      title,
      description,
      keywords: buildKeywords([collection.name], CORE_KEYWORDS, STYLE_KEYWORDS, LOCATION_KEYWORDS),
      openGraph: {
        type: "website",
        locale: SITE_LOCALE,
        url,
        siteName: SITE_NAME,
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${collection.name} - RIDMO`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: TWITTER_HANDLE,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch {
    return {};
  }
}
import Link from "next/link"
import { notFound } from "next/navigation"
import { CatalogBreadcrumb, ProductsGrid } from "@/modules/catalog"

type CollectionPageProps = {
  params: {
    collectionSlug: string
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionSlug } = await params
  
  try {
    // Get the collection and its items in parallel using Promise.all
    const [collection, products] = await Promise.all([
      getCollectionBySlug(collectionSlug),
      getProductsByCollectionSlug(collectionSlug)
    ])

    if (!collection) {
      notFound()
    }

    const collectionUrl = absoluteUrl(`/${collection.slug}`)

    return (
      <section className="pb-6 md:pb-24 lg:pb-5">
        <JsonLd
          data={[
            collectionSchema({
              name: collection.name,
              description: collection.description,
              url: collectionUrl,
              image: collection.imageUrl,
              products: products.map((product) => ({
                name: product.name,
                url: absoluteUrl(`/${collection.slug}/${product.slug}`),
                image: product.image,
              })),
            }),
            breadcrumbSchema([
              { name: "Inicio", url: absoluteUrl("/") },
              { name: collection.name, url: collectionUrl },
            ]),
          ]}
        />
        {/* Breadcrumb */}
        <CatalogBreadcrumb collectionLabel={collection.name} className="mb-1" />

    
        {/* Items Grid */}
        {products.length > 0 ? (
          <div className="mt-4">
            <ProductsGrid products={products} collectionSlug={collectionSlug} />
          </div>
        ) : (
          <div className="container px-4 md:px-6">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Esta colección aún no tiene productos disponibles.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium hover:underline underline-offset-4"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </section>
    )
  } catch (error) {
    notFound()
  }
}
