"use client"

import { ChangeEvent, FormEvent, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export interface CollectionFormValues {
  name: string
  slug: string
  description: string
  imageUrl: string
  isActive: boolean
}

interface CollectionFormProps {
  initialValues?: Partial<CollectionFormValues>
  onSubmit: (values: CollectionFormValues) => Promise<void>
  submitLabel?: string
  submittingLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  renderImageField?: (value: string, onChange: (value: string) => void) => React.ReactNode
}

const defaultValues: CollectionFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  isActive: true,
}

export function CollectionForm({
  initialValues,
  onSubmit,
  submitLabel = "Save collection",
  submittingLabel = "Saving...",
  cancelLabel = "Cancel",
  onCancel,
  renderImageField,
}: CollectionFormProps) {
  const [values, setValues] = useState<CollectionFormValues>({
    ...defaultValues,
    ...initialValues,
  })
  const [submitting, setSubmitting] = useState(false)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, "")
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const autoSlug = useMemo(() => generateSlug(values.name), [values.name])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValues(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim(),
        imageUrl: values.imageUrl.trim(),
      })
    } catch (error) {
      console.error("Error submitting collection form", error)
    } finally {
      setSubmitting(false)
    }
  }

  const imageField = renderImageField
    ? renderImageField(values.imageUrl, (url) => setValues(prev => ({ ...prev, imageUrl: url })))
    : (
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={values.imageUrl}
          onChange={(e) => setValues(prev => ({ ...prev, imageUrl: e.target.value }))}
          placeholder="https://..."
          disabled={submitting}
        />
      </div>
    )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={handleNameChange}
            placeholder="Collection name"
            required
            disabled={submitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => setValues(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="collection-slug"
            required
            disabled={submitting}
          />
          <p className="text-xs text-gray-500">Auto-generated: {autoSlug || "n/a"}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => setValues(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Collection description..."
            rows={3}
            disabled={submitting}
          />
        </div>
        {imageField}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={values.isActive}
            onCheckedChange={(checked) => setValues(prev => ({ ...prev, isActive: checked }))}
            disabled={submitting}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
