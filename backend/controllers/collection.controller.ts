import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BaseController } from './base.controller';
import { CollectionDatasource } from '../datasources/collection.datasource';

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  slug: z.string().min(1, 'Collection slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateCollectionSchema = createCollectionSchema.partial();

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  isActive: z.string().optional().transform(val => val === 'true'),
});

export class CollectionController extends BaseController {
  private collectionDatasource: CollectionDatasource;

  constructor() {
    super();
    this.collectionDatasource = new CollectionDatasource();
  }

  // Methods for actions (non-HTTP)
  async getCollections(options?: {
    page?: number
    limit?: number
    isActive?: boolean
  }) {
    return await this.collectionDatasource.findMany({
      page: options?.page || 1,
      limit: options?.limit || 100,
      isActive: options?.isActive,
    });
  }

  async getCollectionById(id: string) {
    return await this.collectionDatasource.findById(id);
  }

  async getCollectionBySlug(slug: string) {
    return await this.collectionDatasource.findBySlug(slug, false);
  }

  // HTTP methods
  async GET(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        const validatedQuery = querySchema.parse(query);

        // Check if this is a single collection request (has ID in URL)
        const pathSegments = new URL(req.url).pathname.split('/');
        const collectionId = pathSegments[pathSegments.length - 1];

        if (collectionId && collectionId !== 'collections') {
          // Get single collection
          const collection = await this.collectionDatasource.findById(collectionId);
          if (!collection) {
            return this.createErrorResponse('Collection not found', 404);
          }
          return this.createSuccessResponse(collection);
        }

        // Get all collections with pagination and filters
        const collections = await this.collectionDatasource.findMany({
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          isActive: validatedQuery.isActive,
        });

        return this.createSuccessResponse(collections);
      }
    );
  }

  async POST(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req, data) => {
        const collection = await this.collectionDatasource.create(data);
        return this.createSuccessResponse(collection, 201);
      },
      {
        validation: createCollectionSchema,
      }
    );
  }

  async PUT(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req, data) => {
        const pathSegments = new URL(req.url).pathname.split('/');
        const collectionId = pathSegments[pathSegments.length - 1];

        if (!collectionId) {
          return this.createErrorResponse('Collection ID is required', 400);
        }

        const collection = await this.collectionDatasource.update(collectionId, data);
        return this.createSuccessResponse(collection);
      },
      {
        validation: updateCollectionSchema,
      }
    );
  }

  async DELETE(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        const pathSegments = new URL(req.url).pathname.split('/');
        const collectionId = pathSegments[pathSegments.length - 1];

        if (!collectionId) {
          return this.createErrorResponse('Collection ID is required', 400);
        }

        await this.collectionDatasource.delete(collectionId);
        return this.createSuccessResponse({ message: 'Collection deleted successfully' });
      }
    );
  }
}
