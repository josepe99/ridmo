"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadComponent, ImageUpload } from "./image-upload"
import { CollectionForm, CollectionFormValues } from "@/app/admin/collections/components/CollectionForm"

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
}


interface EditCollectionModalProps {
  collection: Collection
}

export function EditCollectionModal({ collection }: EditCollectionModalProps) {
  const [open, setOpen] = useState(false)
  // Manejo de imagenes
  const [images, setImages] = useState<ImageUpload[]>(
    collection.imageUrl
      ? [{ url: collection.imageUrl, preview: collection.imageUrl, isExisting: true }]
      : []
  )
  const router = useRouter()

  const handleSubmit = async (values: CollectionFormValues) => {
    try {
      let imageUrl = values.imageUrl || images[0]?.url || ""
      // Si hay imagen nueva sin url, subirla
      const newImage = images.find(img => img.file && !img.url)
      if (newImage) {
        const formDataImg = new FormData()
        formDataImg.append("image0", newImage.file!)
        const uploadRes = await fetch("/api/admin/images", {
          method: "POST",
          body: formDataImg,
        })
        if (!uploadRes.ok) throw new Error("Error uploading image")
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data?.images?.[0]?.url || imageUrl
      }

      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, imageUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to update collection")
      }

      toast.success("Collection updated successfully!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating collection:", error)
      toast.error("Failed to update collection")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>
            Update the collection details.
          </DialogDescription>
        </DialogHeader>
        <CollectionForm
          initialValues={{
            name: collection.name,
            slug: collection.slug,
            description: collection.description || "",
            imageUrl: collection.imageUrl || "",
            isActive: collection.isActive,
          }}
          submitLabel="Update Collection"
          submittingLabel="Updating..."
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
          renderImageField={(imageUrl, setImageUrl) => (
            <div className="grid gap-2">
              <ImageUploadComponent
                images={images}
                onImagesChange={(newImages) => {
                  setImages(newImages)
                  const nextUrl = newImages[0]?.url || imageUrl || ""
                  setImageUrl(nextUrl)
                }}
                maxImages={1}
                className="border-t pt-2"
              />
            </div>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
