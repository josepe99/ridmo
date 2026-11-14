"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit } from "lucide-react"

import { ItemForm } from "@/app/admin/item/components/ItemForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
