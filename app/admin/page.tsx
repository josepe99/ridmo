import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { EditCollectionModal } from '@/components/admin/edit-collection-modal'

export default async function AdminCollectionsPage() {
  await requireAdmin()

  const collections = await prisma.collection.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          items: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin - Collections</h1>
          <p className="text-gray-600 mt-2">Manage your product collections</p>
        </div>
        <Link href="/admin/collections/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                {collection.imageUrl ? (
                  <Image
                    src={collection.imageUrl}
                    alt={collection.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{collection.name}</CardTitle>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {collection.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{collection._count.items} items</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  collection.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {collection.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/collections/${collection.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
                <EditCollectionModal collection={collection} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first collection</p>
            <Link href="/admin/collections/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
