import { cn } from "@/lib/utils";
import type { Item } from "@/lib/data";
import GridProductCard from "@/components/products/home-grid/grid-product-card";

type ProductsGridProps = {
  products: Item[];
  collectionSlug?: string;
  title?: string;
  className?: string;
};

export default function ProductsGrid({
  products,
  collectionSlug,
  title,
  className,
}: ProductsGridProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="px-4 md:px-1">
        {title && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 uppercase
            tracking-wide font-display"
          >
            {title}
          </h2>
        )}
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-0", className)}>
          {products.map((product) => (
            <GridProductCard
              key={product.id}
              product={product}
              collectionSlug={collectionSlug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
