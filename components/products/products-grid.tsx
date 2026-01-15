import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Item } from "@/lib/data";
import Price from "@/components/price";

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
    <section className="w-full bg-white border-t border-gray-100">
      <div className="px-4 md:px-1">
        {title && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 uppercase tracking-wide">
            {title}
          </h2>
        )}
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
          {products.map((product) => {
            const resolvedCollectionSlug =
              collectionSlug ?? product.collectionSlug;
            const href = resolvedCollectionSlug
              ? `/${resolvedCollectionSlug}/${product.slug}`
              : `/${product.slug}`;

            return (
              <div
                key={product.id}
                className="relative flex flex-col items-center justify-start"
              >
                <div
                  className="relative w-full aspect-[3/4] max-h-[520px] bg-white
                    overflow-hidden border border-gray-100 flex items-center justify-center"
                >
                  <Link
                    href={href}
                    className="group w-full h-full flex items-center justify-center"
                    prefetch={false}
                  >
                    <Image
                      src={
                        product.image ||
                        "/placeholder.svg?height=400&width=300&query=fashion product"
                      }
                      fill
                      style={{ objectFit: "contain" }}
                      alt={product.name}
                      className="transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="relative z-10 w-full text-left mt-4 px-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <Price
                    value={product.price}
                    className="text-base font-semibold mt-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
