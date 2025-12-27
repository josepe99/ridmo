"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"

import { ItemForm } from "@/app/admin/item/components/ItemForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Item</h1>
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
              <div className="flex gap-3">
                <Button onClick={() => router.push("/admin")}>
                  Back to admin
                </Button>
                <Link href="/admin/collections/create">
                  <Button variant="outline">
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
