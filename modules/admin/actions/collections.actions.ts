'use server'

import { requireAdmin } from '@/modules/users/server'
import { CollectionController } from '../services/controllers/collection.controller'

const collectionController = new CollectionController()

export async function getCollectionById(id: string) {
  await requireAdmin()
  try {
    const result = await collectionController.getCollectionById(id)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching collection:', error)
    return { success: false, error: 'No se pudo cargar la colección' }
  }
}

export async function getByAdminAction(id: string) {
  await requireAdmin()
  const identifier = id?.trim()
  if (!identifier) {
    return { success: false, error: 'El id de la colección es obligatorio' }
  }

  try {
    const result = await collectionController.getByAdmin(identifier)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching admin collection:', error)
    return { success: false, error: 'No se pudo cargar la colección' }
  }
}
