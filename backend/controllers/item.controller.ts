import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BaseController } from './base.controller';
import { ItemDatasource } from '../datasources/item.datasource';

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

  constructor() {
    super();
    this.itemDatasource = new ItemDatasource();
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
      async (req, data) => {
        const item = await this.itemDatasource.create(data);
        return this.createSuccessResponse(item, 201);
      },
      {
        validation: createItemSchema,
      }
    );
  }

  async PUT(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req, data) => {
        const pathSegments = new URL(req.url).pathname.split('/');
        const itemId = pathSegments[pathSegments.length - 1];

        if (!itemId) {
          return this.createErrorResponse('Item ID is required', 400);
        }

        const item = await this.itemDatasource.update(itemId, data);
        return this.createSuccessResponse(item);
      },
      {
        validation: updateItemSchema,
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
