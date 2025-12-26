"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CollectionForm, CollectionFormValues } from "@/app/admin/collections/components/CollectionForm"

interface CreateCollectionPageClientProps {
  onUploadImage: (formData: FormData) => Promise<{
    success: boolean
    data?: { url?: string }
    error?: string
  }>
}

export function CreateCollectionPageClient({ onUploadImage }: CreateCollectionPageClientProps) {
  const router = useRouter()

  const handleSubmit = async (values: CollectionFormValues) => {
    const response = await fetch("/api/admin/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      toast.error("Failed to create collection")
      return
    }

    toast.success("Collection created successfully!")
    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Create New Collection</h1>
              <p className="text-gray-600 mt-1">Add a new collection to organize your products.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Collection details</CardTitle>
            </CardHeader>
            <CardContent>
              <CollectionForm
                submitLabel="Create collection"
                submittingLabel="Creating..."
                onSubmit={handleSubmit}
                onUploadImage={onUploadImage}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
