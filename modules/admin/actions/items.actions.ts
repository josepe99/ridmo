'use server'

import { requireAdmin } from '@/modules/users/server'
import { ItemController } from '../services/controllers/item.controller'

const itemController = new ItemController()

export async function getItems(options?: {
  page?: number
  limit?: number
  collectionId?: string
  search?: string
  isActive?: boolean
}) {
  await requireAdmin()
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
  await requireAdmin()
  try {
    const result = await itemController.getItemById(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching item:', error)
    return { success: false, error: 'Failed to fetch item' }
  }
}

export async function getItemsByCollectionId(collectionId: string) {
  await requireAdmin()
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
