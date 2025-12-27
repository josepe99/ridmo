"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import { ImageUploadComponent, ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type ItemFormMode = "create" | "edit"

export interface ItemFormValues {
  name: string
  slug: string
  description: string
  price: string
  comparePrice: string
  sku: string
  inventory: string
  tags: string[]
  isActive: boolean
  collectionId: string
}

interface ItemFormProps {
  mode: ItemFormMode
  collectionId?: string
  itemId?: string
  initialValues?: Partial<ItemFormValues> & {
    id?: string
    images?: string[]
  }
  collectionOptions?: { id: string; name: string }[]
  onCancel?: () => void
  onSuccess?: (item: any) => void
  submitLabel?: string
  submittingLabel?: string
}

const defaultValues: ItemFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  comparePrice: "",
  sku: "",
  inventory: "",
  tags: [],
  isActive: true,
  collectionId: "",
}

const toStringValue = (value?: string | number | null) =>
  value === undefined || value === null ? "" : String(value)

export function ItemForm({
  mode,
  collectionId,
  itemId,
  initialValues,
  collectionOptions,
  onCancel,
  onSuccess,
  submitLabel,
  submittingLabel,
}: ItemFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<ItemFormValues>({
    ...defaultValues,
    ...initialValues,
    price: toStringValue(initialValues?.price),
    comparePrice: toStringValue(initialValues?.comparePrice),
    inventory: toStringValue(initialValues?.inventory),
    sku: toStringValue(initialValues?.sku),
    description: toStringValue(initialValues?.description),
    collectionId:
      initialValues?.collectionId ||
      collectionId ||
      collectionOptions?.[0]?.id ||
      "",
  })
  const [images, setImages] = useState<ImageUpload[]>(
    (initialValues?.images || []).map((url) => ({
      url,
      preview: url,
      isExisting: true,
    }))
  )
  const [newTag, setNewTag] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isEdit = mode === "edit"
  const targetItemId = itemId || initialValues?.id

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValues((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }))
  }

  const addTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !values.tags.includes(trimmed)) {
      setValues((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (mode === "create" && !values.collectionId) {
      toast.error("Please select a collection before creating an item.")
      return
    }

    if (isEdit && !targetItemId) {
      toast.error("Missing item id to update.")
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()

      formData.append("name", values.name.trim())
      formData.append("slug", values.slug.trim())
      formData.append("description", values.description.trim())
      formData.append("price", values.price)
      if (values.comparePrice) {
        formData.append("comparePrice", values.comparePrice)
      }
      if (values.sku) {
        formData.append("sku", values.sku.trim())
      }
      formData.append("inventory", values.inventory || "0")
      if (values.collectionId) {
        formData.append("collectionId", values.collectionId)
      }
      formData.append("tags", JSON.stringify(values.tags))
      formData.append("isActive", values.isActive.toString())

      const existingImages = images
        .filter((img) => img.url)
        .map((img) => img.url)

      if (existingImages.length > 0) {
        formData.append("existingImages", JSON.stringify(existingImages))
      }

      images.forEach((img, index) => {
        if (img.file && !img.url) {
          formData.append(`image${index}`, img.file)
        }
      })

      const endpoint = isEdit
        ? `/api/admin/items/${targetItemId}`
        : "/api/admin/items"

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.error ||
            `Failed to ${isEdit ? "update" : "create"} item`
        )
      }

      const item = await response.json()
      toast.success(
        isEdit ? "Item updated successfully!" : "Item created successfully!"
      )

      if (onSuccess) {
        onSuccess(item)
      } else {
        if (!isEdit) {
          setValues((prev) => ({
            ...defaultValues,
            collectionId: prev.collectionId,
          }))
          setImages([])
          setNewTag("")
        }
        router.refresh()
      }
    } catch (error) {
      console.error("Error submitting item form:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit item form"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {collectionOptions && collectionOptions.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="collectionId">Collection</Label>
          <Select
            value={values.collectionId}
            onValueChange={(val) =>
              setValues((prev) => ({ ...prev, collectionId: val }))
            }
            disabled={submitting}
          >
            <SelectTrigger id="collectionId">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collectionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={handleNameChange}
              placeholder="Item name"
              required
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="item-slug"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Item description..."
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={values.price}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.00"
              required
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comparePrice">Compare Price</Label>
            <Input
              id="comparePrice"
              type="number"
              step="0.01"
              value={values.comparePrice}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  comparePrice: e.target.value,
                }))
              }
              placeholder="0.00"
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inventory">Inventory</Label>
            <Input
              id="inventory"
              type="number"
              value={values.inventory}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  inventory: e.target.value,
                }))
              }
              placeholder="0"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={values.sku}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="SKU-001"
            disabled={submitting}
          />
        </div>

        <ImageUploadComponent
          images={images}
          onImagesChange={setImages}
          maxImages={10}
          className="border-t pt-4"
        />

        <div className="grid gap-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag()
                }
              }}
              disabled={submitting}
            />
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              disabled={submitting}
            >
              Add
            </Button>
          </div>
          {values.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {values.tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                    disabled={submitting}
                    aria-label={`Remove ${tag}`}
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
            checked={values.isActive}
            onCheckedChange={(checked) =>
              setValues((prev) => ({ ...prev, isActive: checked }))
            }
            disabled={submitting}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? submittingLabel ||
              (isEdit ? "Updating..." : "Creating...")
            : submitLabel || (isEdit ? "Update Item" : "Create Item")}
        </Button>
      </div>
    </form>
  )
}
