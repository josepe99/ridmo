import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CreateItemModal } from '@/components/admin/create-item-modal'
import { EditItemModal } from '@/components/admin/edit-item-modal'

interface PageProps {
  params: {
    collectionId: string
  }
}

export default async function AdminCollectionPage({ params }: PageProps) {
  await requireAdmin()

  const collection = await prisma.collection.findUnique({
    where: { id: params.collectionId },
    include: {
      items: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!collection) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="text-gray-600 mt-1">{collection.description || 'No description'}</p>
        </div>
        <CreateItemModal collectionId={collection.id} />
      </div>

      {/* Collection Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.items.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collection.items.filter(item => item.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={collection.isActive ? "default" : "secondary"}>
              {collection.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {new Date(collection.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Items</h2>
        
        {collection.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collection.items.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {item.images.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
                    <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs">
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">Gs. {item.price}</span>
                    </div>
                    {item.comparePrice && (
                      <div className="flex justify-between">
                        <span>Compare:</span>
                        <span className="line-through">Gs. {item.comparePrice}</span>
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
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-500 mb-4">Add your first item to this collection</p>
              <CreateItemModal collectionId={collection.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
