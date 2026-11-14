import { Metadata } from "next"
import { getCollectionBySlug, getProductsByCollectionSlug } from "@/modules/catalog/server"

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
    const url = `https://www.milocompany.store/${collection.slug}`;
    return {
      title,
      description,
      openGraph: {
        type: "website",
        locale: "es_PY",
        url,
        siteName: "RIDMO",
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
        creator: "@milowearcompany",
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

    return (
      <section className="pb-6 md:pb-24 lg:pb-5">
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
