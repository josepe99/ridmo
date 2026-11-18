import Link from "next/link";
import Image from "next/image";

import type { ProductSummary } from "../../types";
import Price from "../price";

type GridProductCardProps = {
  product: ProductSummary;
  collectionSlug?: string;
};

// Grid is 2 columns on mobile and 4 from md up, so the browser can pick a right-sized variant.
const CARD_IMAGE_SIZES = "(min-width: 768px) 25vw, 50vw";

export default function GridProductCard({
  product,
  collectionSlug,
}: GridProductCardProps) {
  const resolvedCollectionSlug = collectionSlug ?? product.collectionSlug;
  const href = resolvedCollectionSlug
    ? `/${resolvedCollectionSlug}/${product.slug}`
    : `/${product.slug}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center justify-start"
      prefetch={false}
    >
      <div
        className="relative w-full aspect-[3/4] max-h-[520px] bg-white
          overflow-hidden border border-gray-100"
      >
        <Image
          src={
            product.image ||
            "/placeholder.svg?height=400&width=300&query=fashion product"
          }
          fill
          alt={product.name}
          sizes={CARD_IMAGE_SIZES}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.hoverImage && (
          // Decorative duplicate of the product: hidden from assistive tech (alt="").
          <Image
            src={product.hoverImage}
            fill
            alt=""
            sizes={CARD_IMAGE_SIZES}
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            loading="lazy"
          />
        )}
      </div>
      <div className="relative z-10 w-full text-left mt-2 px-2">
        <span className="text-xs font-display">{product.name}</span>
        <br />
        <Price value={product.price} className="text-xs mt-1" />
      </div>
    </Link>
  );
}
