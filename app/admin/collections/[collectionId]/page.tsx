import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { getByAdminAction } from '@/modules/admin/server';
import { EditItemModal } from '@/modules/admin';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/modules/users/server';
import { Price } from '@/modules/catalog';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
  params: {
    collectionId: string
  }
}

export default async function AdminCollectionPage({ params }: PageProps) {
  await requireAdmin()

  // Await params to satisfy Next.js dynamic API requirements
  const { collectionId: rawCollectionId } = await params
  const collectionId = rawCollectionId?.trim()

  if (!collectionId) {
    notFound()
  }

  const collectionResult = await getByAdminAction(collectionId)

  if (!collectionResult.success || !collectionResult.data) {
    notFound()
  }

  const collection = collectionResult.data
  const createItemHref = `/admin/item/create?collectionId=${collection.id}`

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-3 sm:items-center sm:gap-4">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="size-10 sm:size-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-0">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">{collection.name}</h1>
          <p className="mt-1 break-words text-gray-600">{collection.description || 'Sin descripción'}</p>
        </div>
        <Link href={createItemHref} className="w-full sm:w-auto">
          <Button className="h-10 w-full sm:h-9 sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </Button>
        </Link>
      </div>

      {/* Collection Info */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total de productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.items.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Productos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collection.items.filter(item => item.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={collection.isActive ? "default" : "secondary"}>
              {collection.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Creada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {new Date(collection.createdAt).toLocaleDateString('es-PY')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        
        {collection.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {collection.items.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {item.images.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Sin imagen</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-medium line-clamp-1">{item.name}</h3>
                    <Badge variant={item.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <Price value={item.price} className="font-medium" />
                    </div>
                    {item.comparePrice && (
                      <div className="flex justify-between">
                        <span>Precio anterior:</span>
                        <Price value={item.comparePrice} className="line-through" />
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className={item.inventory > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.inventory}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <EditItemModal item={item} />
                    <Button variant="outline" size="sm" className="h-10 text-red-600 hover:text-red-700 sm:h-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="px-4 text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Todavía no hay productos</h3>
              <p className="text-gray-500 mb-4">Agregá tu primer producto a esta colección</p>
              <Link href={createItemHref}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar producto
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
