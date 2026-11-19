"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { CollectionForm, CollectionFormValues } from "@/modules/admin"

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
      toast.error("No se pudo crear la colección")
      return
    }

    toast.success("¡Colección creada con éxito!")
    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="container mx-auto min-h-screen px-4 py-6 sm:py-8">
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-start gap-3 sm:items-center">
            <Link href="/admin" className="shrink-0">
              <Button variant="outline" size="icon" className="size-10 sm:size-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold sm:text-3xl">Crear nueva colección</h1>
              <p className="text-gray-600 mt-1">Agregá una colección para organizar tus productos.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la colección</CardTitle>
            </CardHeader>
            <CardContent>
              <CollectionForm
                submitLabel="Crear colección"
                submittingLabel="Creando..."
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
