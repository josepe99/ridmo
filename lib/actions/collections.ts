'use server'

import { CollectionController } from '@/backend/controllers/collection.controller'

const collectionController = new CollectionController()

export async function getCollections(options?: {
  page?: number
  limit?: number
  isActive?: boolean
}) {
  try {
    const result = await collectionController.getCollections({
      page: options?.page || 1,
      limit: options?.limit || 100,
      isActive: options?.isActive,
    })
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

export async function getCollectionBySlug(slug: string) {
  const collection = await collectionController.getCollectionBySlug(slug)
  
  if (!collection) {
    throw new Error('Collection not found')
  }
  
  return collection
}
