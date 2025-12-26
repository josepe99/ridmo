'use server'

import { ItemController } from '@/lib/controllers/item.controller'

const itemController = new ItemController()

export async function getItems(options?: {
  page?: number
  limit?: number
  collectionId?: string
  search?: string
  isActive?: boolean
}) {
  try {
    const result = await itemController.getItems({
      page: options?.page || 1,
      limit: options?.limit || 10,
      collectionId: options?.collectionId,
      search: options?.search,
      isActive: options?.isActive,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching items:', error)
    return { success: false, error: 'Failed to fetch items' }
  }
}

export async function getItemById(id: string) {
  try {
    const result = await itemController.getItemById(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching item:', error)
    return { success: false, error: 'Failed to fetch item' }
  }
}

export async function getItemsByCollectionId(collectionId: string) {
  try {
    const result = await itemController.getItems({
      page: 1,
      limit: 100,
      collectionId: collectionId,
      isActive: true
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching items by collection:', error)
    return { success: false, error: 'Failed to fetch items by collection' }
  }
}

export async function getItemBySlug(slug: string) {
  const result = await itemController.getItemBySlug(slug)
  if (!result) {
    throw new Error('Item not found')
  }
  return result
}

export async function getItemsByCollectionSlug(collectionSlug: string) {
  // Import collections action to get collection by slug
  const { getCollectionBySlug } = await import('./collections.actions')
  const collection = await getCollectionBySlug(collectionSlug)

  const result = await itemController.getItems({
    page: 1,
    limit: 100,
    collectionId: collection.id,
    isActive: true
  })
  
  return result.data
}
