"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit } from "lucide-react"

import { ItemForm } from "./item-form"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"

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
  collectionId?: string
}

interface EditItemModalProps {
  item: Item
}

export function EditItemModal({ item }: EditItemModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 flex-1 sm:h-8">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-[700px] sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the item details. You can add new images or remove existing ones.
          </DialogDescription>
        </DialogHeader>

        <ItemForm
          mode="edit"
          itemId={item.id}
          collectionId={item.collectionId}
          initialValues={{
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description ?? "",
            price: item.price,
            comparePrice: item.comparePrice ?? "",
            sku: item.sku ?? "",
            inventory: item.inventory,
            tags: item.tags,
            isActive: item.isActive,
            images: item.images,
            collectionId: item.collectionId,
          }}
          submitLabel="Update Item"
          submittingLabel="Updating..."
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
