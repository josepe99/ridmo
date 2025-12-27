import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { CreateItemPageClient } from "./create-page-client"

interface CreateItemPageProps {
  searchParams?: Promise<{
    collectionId?: string | string[]
  }>
}

export default async function CreateItemPage({
  searchParams,
}: CreateItemPageProps = {}) {
  await requireAdmin()

  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  const collectionIdParam = resolvedSearchParams?.collectionId
  const requestedCollectionId =
    Array.isArray(collectionIdParam) && collectionIdParam.length > 0
      ? collectionIdParam[0]
      : typeof collectionIdParam === "string"
        ? collectionIdParam
        : undefined

  const defaultCollectionId = requestedCollectionId &&
    collections.some((collection) => collection.id === requestedCollectionId)
      ? requestedCollectionId
      : collections[0]?.id

  return (
    <CreateItemPageClient
      collections={collections}
      defaultCollectionId={defaultCollectionId}
    />
  )
}
