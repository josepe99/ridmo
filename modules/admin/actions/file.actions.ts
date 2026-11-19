'use server'

import { requireAdmin } from '@/modules/users/server'
import { StorageListOptions, StorageUploadOptions } from '../services/datasources/s3.datasource'
import { FileController } from '../services/controllers/file.controller'

const fileController = new FileController()

export async function uploadImage(
  file: File | Buffer | string,
  options: StorageUploadOptions = {}
) {
  await requireAdmin()
  try {
    const data = await fileController.uploadImage(file, options)
    return { success: true, data }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { success: false, error: 'No se pudo subir el archivo' }
  }
}

export async function getImage(publicId: string) {
  await requireAdmin()
  try {
    const data = await fileController.getImage(publicId)
    return { success: true, data }
  } catch (error) {
    console.error('Error getting file:', error)
    return { success: false, error: 'No se pudo obtener el archivo' }
  }
}

export async function getImages(options: StorageListOptions = {}) {
  await requireAdmin()
  try {
    const data = await fileController.getImages(options)
    return { success: true, data }
  } catch (error) {
    console.error('Error listing files:', error)
    return { success: false, error: 'No se pudieron listar los archivos' }
  }
}

export async function removeImage(publicId: string) {
  await requireAdmin()
  try {
    await fileController.removeImage(publicId)
    return { success: true }
  } catch (error) {
    console.error('Error removing file:', error)
    return { success: false, error: 'No se pudo eliminar el archivo' }
  }
}
