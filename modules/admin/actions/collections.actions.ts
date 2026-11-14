'use server'

import { unstable_cache } from 'next/cache'
import { CollectionController } from '@/lib/controllers/collection.controller'

const collectionController = new CollectionController()

// Cached version of getCollections for homepage - revalidates every 60 seconds
const getCachedCollections = unstable_cache(
  async (page: number, limit: number, isActive?: boolean) => {
    return await collectionController.getCollections({
      page,
      limit,
      isActive,
    })
  },
  ['collections-list'],
  { 
    revalidate: 60, // Cache for 60 seconds
    tags: ['collections'] 
  }
)

export async function getCollections(options?: {
  page?: number
  limit?: number
  isActive?: boolean
}) {
  try {
    const result = await getCachedCollections(
      options?.page || 1,
      options?.limit || 100,
      options?.isActive
    )
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { success: false, error: 'Failed to fetch collections' }
  }
}

export async function getCollectionById(id: string) {
  try {
    const result = await collectionController.getCollectionById(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching collection:', error)
    return { success: false, error: 'Failed to fetch collection' }
  }
}

export async function getByAdminAction(id: string) {
  const identifier = id?.trim()
  if (!identifier) {
    return { success: false, error: 'Collection id is required' }
  }

  try {
    const result = await collectionController.getByAdmin(identifier)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching admin collection:', error)
    return { success: false, error: 'Failed to fetch collection' }
  }
}

export async function getCollectionBySlug(slug: string) {
  const collection = await collectionController.getCollectionBySlug(slug)
  
  if (!collection) {
    throw new Error('Collection not found')
  }
  
  return collection
}
