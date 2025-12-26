'use server'

import { CloudinaryListOptions, CloudinaryUploadOptions } from '@/lib/datasources/cloudinary.datasource'
import { FileController } from '@/lib/controllers/file.controller'

const fileController = new FileController()

export async function uploadImage(
  file: File | Buffer | string,
  options: CloudinaryUploadOptions = {}
) {
  try {
    const data = await fileController.uploadImage(file, options)
    return { success: true, data }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { success: false, error: 'Failed to upload file' }
  }
}

export async function getImage(publicId: string) {
  try {
    const data = await fileController.getImage(publicId)
    return { success: true, data }
  } catch (error) {
    console.error('Error getting file:', error)
    return { success: false, error: 'Failed to get file' }
  }
}

export async function getImages(options: CloudinaryListOptions = {}) {
  try {
    const data = await fileController.getImages(options)
    return { success: true, data }
  } catch (error) {
    console.error('Error listing files:', error)
    return { success: false, error: 'Failed to list files' }
  }
}

export async function removeImage(publicId: string) {
  try {
    await fileController.removeImage(publicId)
    return { success: true }
  } catch (error) {
    console.error('Error removing file:', error)
    return { success: false, error: 'Failed to remove file' }
  }
}
