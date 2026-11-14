import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

type CatalogBreadcrumbProps = {
  collectionLabel?: string
  collectionHref?: string
  productLabel?: string
  className?: string
}

export default function CatalogBreadcrumb({
  collectionLabel,
  collectionHref,
  productLabel,
  className,
}: CatalogBreadcrumbProps) {
  const showCollection = Boolean(collectionLabel)
  const showProduct = Boolean(productLabel)

  return (
    <div className={cn("container px-4 md:px-6 mb-8", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {showCollection && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {collectionHref && showProduct ? (
                  <BreadcrumbLink asChild>
                    <Link href={collectionHref}>{collectionLabel}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{collectionLabel}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {showProduct && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{productLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
