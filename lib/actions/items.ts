'use server'

import { ItemDatasource } from '@/backend/datasources/item.datasource'

const itemDatasource = new ItemDatasource()

export async function getItems(options?: {
  page?: number
  limit?: number
  collectionId?: string
  search?: string
  isActive?: boolean
}) {
  try {
    const result = await itemDatasource.findMany({
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
    const result = await itemDatasource.findById(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching item:', error)
    return { success: false, error: 'Failed to fetch item' }
  }
}

export async function getItemsByCollectionId(collectionId: string) {
  try {
    const result = await itemDatasource.findMany({
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

export async function getItemsByCollectionSlug(collectionSlug: string) {
  try {
    // Import collections action to get collection by slug
    const { getCollectionBySlug } = await import('./collections')
    const collectionResult = await getCollectionBySlug(collectionSlug)
    
    if (!collectionResult.success || !collectionResult.data) {
      return { success: false, error: 'Collection not found' }
    }

    const result = await itemDatasource.findMany({
      page: 1,
      limit: 100,
      collectionId: collectionResult.data.id,
      isActive: true
    })
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching items by collection slug:', error)
    return { success: false, error: 'Failed to fetch items by collection slug' }
  }
}
