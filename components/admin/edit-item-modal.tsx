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
import { Edit, X } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadComponent, ImageUpload } from "./image-upload"

interface Item {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  sku: string | null
  inventory: number
  isActive: boolean
  images: string[]
  tags: string[]
}

interface EditItemModalProps {
  item: Item
}

export function EditItemModal({ item }: EditItemModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: item.name,
    slug: item.slug,
    description: item.description || "",
    price: item.price.toString(),
    comparePrice: item.comparePrice?.toString() || "",
    sku: item.sku || "",
    inventory: item.inventory.toString(),
    tags: [...item.tags],
    isActive: item.isActive
  })
  
  // Initialize images with existing URLs as "existing" images
  const [images, setImages] = useState<ImageUpload[]>(
    item.images.map(url => ({
      url,
      preview: url,
      isExisting: true
    }))
  )
  
  const [newTag, setNewTag] = useState("")
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create FormData for multipart upload
      const submitFormData = new FormData()
      
      // Add text fields
      submitFormData.append('name', formData.name)
      submitFormData.append('slug', formData.slug)
      submitFormData.append('description', formData.description)
      submitFormData.append('price', formData.price)
      if (formData.comparePrice) {
        submitFormData.append('comparePrice', formData.comparePrice)
      }
      submitFormData.append('sku', formData.sku)
      submitFormData.append('inventory', formData.inventory)
      submitFormData.append('tags', JSON.stringify(formData.tags))
      submitFormData.append('isActive', formData.isActive.toString())

      // Add existing images (both original existing and uploaded ones)
      const existingImages = images.filter(img => img.isExisting || img.url).map(img => img.url)
      if (existingImages.length > 0) {
        submitFormData.append('existingImages', JSON.stringify(existingImages))
      }

      // Add new image files
      images.forEach((img, index) => {
        if (img.file && !img.url) {
          submitFormData.append(`image${index}`, img.file)
        }
      })

      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: "PUT",
        body: submitFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update item")
      }

      toast.success("Item updated successfully!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the item details. You can add new images or remove existing ones.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Item name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="item-slug"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Item description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comparePrice">Compare Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  type="number"
                  value={formData.inventory}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU-001"
              />
            </div>

            {/* Image Upload Component */}
            <ImageUploadComponent
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              className="border-t pt-4"
            />

            {/* Tags */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
