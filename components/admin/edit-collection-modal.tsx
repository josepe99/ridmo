"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { Edit } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadComponent, ImageUpload } from "./image-upload"

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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: collection.name,
    slug: collection.slug,
    description: collection.description || "",
    isActive: collection.isActive
  })
  // Manejo de imagenes
  const [images, setImages] = useState<ImageUpload[]>(
    collection.imageUrl
      ? [{ url: collection.imageUrl, preview: collection.imageUrl, isExisting: true }]
      : []
  )
  const router = useRouter()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = images[0]?.url || "";
      // Si hay imagen nueva sin url, subirla
      const newImage = images.find(img => img.file && !img.url);
      if (newImage) {
        const formDataImg = new FormData();
        formDataImg.append("image0", newImage.file!);
        const uploadRes = await fetch("/api/admin/images", {
          method: "POST",
          body: formDataImg,
        });
        if (!uploadRes.ok) throw new Error("Error uploading image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.data?.images?.[0]?.url || imageUrl;
      }

      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update collection");
      }

      toast.success("Collection updated successfully!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    } finally {
      setLoading(false);
    }
  };

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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Collection name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="collection-slug"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Collection description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <ImageUploadComponent
                images={images}
                onImagesChange={setImages}
                maxImages={1}
                className="border-t pt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
