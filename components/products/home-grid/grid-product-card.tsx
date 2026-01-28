import Link from "next/link";
import Image from "next/image";

import type { Item } from "@/lib/data";
import Price from "@/components/price";

type GridProductCardProps = {
  product: Item;
  collectionSlug?: string;
};

export default function GridProductCard({
  product,
  collectionSlug,
}: GridProductCardProps) {
  const resolvedCollectionSlug = collectionSlug ?? product.collectionSlug;
  const href = resolvedCollectionSlug
    ? `/${resolvedCollectionSlug}/${product.slug}`
    : `/${product.slug}`;

  return (
    <div className="relative flex flex-col items-center justify-start">
      <div
        className="relative w-full aspect-[3/4] max-h-[520px] bg-white
          overflow-hidden border border-gray-100"
      >
        <Link
          href={href}
          className="group block w-full h-full"
          prefetch={false}
        >
          <Image
            src={
              product.image ||
              "/placeholder.svg?height=400&width=300&query=fashion product"
            }
            fill
            alt={product.name}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>
      <div className="relative z-10 w-full text-left mt-2 px-2">
        <span className="text-xs font-display">{product.name}</span>
        <br />
        <Price value={product.price} className="text-xs mt-1" />
      </div>
    </div>
  );
}
