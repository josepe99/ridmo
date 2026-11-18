"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"

import { ItemForm } from "@/modules/admin"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface CreateItemPageClientProps {
  collections: { id: string; name: string }[]
  defaultCollectionId?: string
}

export function CreateItemPageClient({
  collections,
  defaultCollectionId,
}: CreateItemPageClientProps) {
  const router = useRouter()

  const handleSuccess = (item: any) => {
    const collectionId = item?.collectionId || defaultCollectionId

    if (collectionId) {
      router.push(`/admin/collections/${collectionId}`)
    } else {
      router.push("/admin")
    }

    router.refresh()
  }

  const hasCollections = collections.length > 0

  return (
    <div className="container mx-auto min-h-screen px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-start gap-3 sm:items-center">
        <Link href="/admin" className="shrink-0">
          <Button variant="outline" size="icon" className="size-10 sm:size-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Create New Item</h1>
          <p className="text-gray-600 mt-1">
            Add a new item and assign it to a collection.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
        </CardHeader>
        <CardContent>
          {hasCollections ? (
            <ItemForm
              mode="create"
              collectionId={defaultCollectionId}
              collectionOptions={collections}
              onSuccess={handleSuccess}
              onCancel={() => router.push("/admin")}
              submitLabel="Create item"
              submittingLabel="Creating..."
            />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                You need at least one collection before creating items.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => router.push("/admin")}>
                  Back to admin
                </Button>
                <Link href="/admin/collections/create">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create a collection
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
