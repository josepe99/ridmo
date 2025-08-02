import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BaseController } from './base.controller';
import { ItemDatasource } from '../datasources/item.datasource';
import { ImageController } from './image.controller';

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  slug: z.string().min(1, 'Item slug is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  sku: z.string().optional(),
  inventory: z.number().int().min(0, 'Inventory cannot be negative').default(0),
  collectionId: z.string().min(1, 'Collection ID is required'),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updateItemSchema = createItemSchema.partial();

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  collection: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true'),
});

export class ItemController extends BaseController {
  private itemDatasource: ItemDatasource;
  private imageController: ImageController;

  constructor() {
    super();
    this.itemDatasource = new ItemDatasource();
    this.imageController = new ImageController();
  }

  // Methods for actions (non-HTTP)
  async getItems(options?: {
    page?: number
    limit?: number
    collectionId?: string
    search?: string
    isActive?: boolean
  }) {
    return await this.itemDatasource.findMany({
      page: options?.page || 1,
      limit: options?.limit || 10,
      collectionId: options?.collectionId,
      search: options?.search,
      isActive: options?.isActive,
    });
  }

  async getItemById(id: string) {
    return await this.itemDatasource.findById(id, true);
  }

  async getItemBySlug(slug: string) {
    return await this.itemDatasource.findBySlug(slug, true);
  }

  async GET(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        const validatedQuery = querySchema.parse(query);

        // Check if this is a single item request (has ID in URL)
        const pathSegments = new URL(req.url).pathname.split('/');
        const itemId = pathSegments[pathSegments.length - 1];

        if (itemId && itemId !== 'items') {
          // Get single item
          const item = await this.itemDatasource.findById(itemId);
          if (!item) {
            return this.createErrorResponse('Item not found', 404);
          }
          return this.createSuccessResponse(item);
        }

        // Get all items with pagination and filters
        const items = await this.itemDatasource.findMany({
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          collectionId: validatedQuery.collection,
          search: validatedQuery.search,
          isActive: validatedQuery.isActive,
        });

        return this.createSuccessResponse(items);
      }
    );
  }

  async POST(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        let uploadedImages: any[] = [];
        
        try {
          const contentType = req.headers.get('content-type') || '';
          let itemData: any;

          if (contentType.includes('multipart/form-data')) {
            // Handle form data with files
            const formData = await req.formData();
            
            // Extract images from form data
            const imageFiles = await this.imageController.processFormDataImages(formData);
            
            // Upload images if any
            if (imageFiles.length > 0) {
              uploadedImages = await this.imageController.uploadImages(imageFiles, {
                folder: 'milowearco/items'
              });
            }

            // Extract other form data
            itemData = {
              name: formData.get('name') as string,
              slug: formData.get('slug') as string,
              description: formData.get('description') as string || undefined,
              price: parseFloat(formData.get('price') as string),
              comparePrice: formData.get('comparePrice') ? parseFloat(formData.get('comparePrice') as string) : undefined,
              sku: formData.get('sku') as string || undefined,
              inventory: parseInt(formData.get('inventory') as string) || 0,
              collectionId: formData.get('collectionId') as string,
              tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
              isActive: formData.get('isActive') === 'true',
              images: uploadedImages.map(img => img.url)
            };
          } else {
            // Handle JSON data
            itemData = await req.json();
          }

          // Validate the data
          const validatedData = createItemSchema.parse(itemData);

          // Check if slug already exists
          await this.itemDatasource.validateSlug(validatedData.slug);

          // Create the item
          const item = await this.itemDatasource.create(validatedData);
          
          return this.createSuccessResponse({
            ...item,
            uploadedImages: uploadedImages.length > 0 ? uploadedImages : undefined
          }, 201);
        } catch (error) {
          console.error('Error creating item:', error);
          
          // If we uploaded images but failed to create item, clean up
          if (uploadedImages.length > 0) {
            try {
              await this.imageController.deleteImages(uploadedImages.map((img: any) => img.publicId));
            } catch (cleanupError) {
              console.error('Error cleaning up uploaded images:', cleanupError);
            }
          }

          if (error instanceof Error) {
            return this.createErrorResponse(error.message, 400);
          }
          
          return this.createErrorResponse('Failed to create item', 500);
        }
      }
    );
  }

  async PUT(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        let uploadedImages: any[] = [];
        
        try {
          const pathSegments = new URL(req.url).pathname.split('/');
          const itemId = pathSegments[pathSegments.length - 1];

          if (!itemId) {
            return this.createErrorResponse('Item ID is required', 400);
          }

          const contentType = req.headers.get('content-type') || '';
          let itemData: any;

          if (contentType.includes('multipart/form-data')) {
            // Handle form data with files
            const formData = await req.formData();
            
            // Extract images from form data
            const imageFiles = await this.imageController.processFormDataImages(formData);
            
            // Upload new images if any
            if (imageFiles.length > 0) {
              uploadedImages = await this.imageController.uploadImages(imageFiles, {
                folder: 'milowearco/items'
              });
            }

            // Get existing images from form data
            const existingImages = formData.get('existingImages');
            const existingImageUrls = existingImages ? JSON.parse(existingImages as string) : [];

            // Extract other form data
            itemData = {
              name: formData.get('name') as string || undefined,
              slug: formData.get('slug') as string || undefined,
              description: formData.get('description') as string || undefined,
              price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
              comparePrice: formData.get('comparePrice') ? parseFloat(formData.get('comparePrice') as string) : undefined,
              sku: formData.get('sku') as string || undefined,
              inventory: formData.get('inventory') ? parseInt(formData.get('inventory') as string) : undefined,
              collectionId: formData.get('collectionId') as string || undefined,
              tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
              isActive: formData.get('isActive') ? formData.get('isActive') === 'true' : undefined,
              images: [...existingImageUrls, ...uploadedImages.map(img => img.url)]
            };
          } else {
            // Handle JSON data
            itemData = await req.json();
          }

          // Remove undefined values
          Object.keys(itemData).forEach(key => {
            if (itemData[key] === undefined) {
              delete itemData[key];
            }
          });

          // Validate the data
          const validatedData = updateItemSchema.parse(itemData);

          // Check if slug already exists (excluding current item)
          if (validatedData.slug) {
            await this.itemDatasource.validateSlug(validatedData.slug, itemId);
          }

          // Update the item
          const item = await this.itemDatasource.update(itemId, validatedData);
          
          return this.createSuccessResponse({
            ...item,
            uploadedImages: uploadedImages.length > 0 ? uploadedImages : undefined
          });
        } catch (error) {
          console.error('Error updating item:', error);
          
          // If we uploaded images but failed to update item, clean up new images
          if (uploadedImages.length > 0) {
            try {
              await this.imageController.deleteImages(uploadedImages.map((img: any) => img.publicId));
            } catch (cleanupError) {
              console.error('Error cleaning up uploaded images:', cleanupError);
            }
          }

          if (error instanceof Error) {
            return this.createErrorResponse(error.message, 400);
          }
          
          return this.createErrorResponse('Failed to update item', 500);
        }
      }
    );
  }

  async DELETE(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        const pathSegments = new URL(req.url).pathname.split('/');
        const itemId = pathSegments[pathSegments.length - 1];

        if (!itemId) {
          return this.createErrorResponse('Item ID is required', 400);
        }

        await this.itemDatasource.delete(itemId);
        return this.createSuccessResponse({ message: 'Item deleted successfully' });
      }
    );
  }
}
