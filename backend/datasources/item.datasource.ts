import { BaseDatasource, PaginationOptions, PaginatedResult } from './base.datasource';

export interface ItemFilters {
  collectionId?: string;
  search?: string;
  isActive?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface ItemCreateData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  inventory?: number;
  collectionId: string;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
}

export interface ItemUpdateData extends Partial<ItemCreateData> {}

export class ItemDatasource extends BaseDatasource {
  async findMany(
    options: PaginationOptions & {
      collectionId?: string;
      search?: string;
      isActive?: boolean;
      priceRange?: { min?: number; max?: number };
      tags?: string[];
    } = {}
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      collectionId,
      search,
      isActive,
      priceRange,
      tags,
    } = options;

    const where: any = {};

    // Apply filters
    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (priceRange) {
      if (priceRange.min !== undefined) {
        where.price = { ...where.price, gte: priceRange.min };
      }
      if (priceRange.max !== undefined) {
        where.price = { ...where.price, lte: priceRange.max };
      }
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: {
          collection: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.item.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(
    id: string,
    includeCollection: boolean = true
  ): Promise<any | null> {
    return await this.prisma.item.findUnique({
      where: { id },
      include: includeCollection ? { collection: true } : undefined,
    });
  }

  async findBySlug(
    slug: string,
    includeCollection: boolean = true
  ): Promise<any | null> {
    return await this.prisma.item.findUnique({
      where: { slug },
      include: includeCollection ? { collection: true } : undefined,
    });
  }

  async create(data: ItemCreateData): Promise<any> {
    return await this.prisma.item.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku,
        inventory: data.inventory ?? 0,
        collectionId: data.collectionId,
        images: data.images ?? [],
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: ItemUpdateData): Promise<any> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.inventory !== undefined) updateData.inventory = data.inventory;
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await this.prisma.item.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<any> {
    return await this.prisma.item.delete({
      where: { id },
    });
  }

  async updateInventory(id: string, quantity: number): Promise<any> {
    return await this.prisma.item.update({
      where: { id },
      data: {
        inventory: {
          increment: quantity,
        },
      },
    });
  }

  async findByCollection(
    collectionId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          collectionId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.item.count({
        where: {
          collectionId,
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async searchItems(
    query: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
          isActive: true,
        },
        include: {
          collection: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.item.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getFeaturedItems(limit: number = 8): Promise<any[]> {
    return await this.prisma.item.findMany({
      where: {
        isActive: true,
      },
      include: {
        collection: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getItemsByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          isActive: true,
        },
        include: {
          collection: true,
        },
        orderBy: {
          price: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.item.count({
        where: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getRelatedItems(
    itemId: string,
    collectionId: string,
    limit: number = 4
  ): Promise<any[]> {
    return await this.prisma.item.findMany({
      where: {
        collectionId,
        isActive: true,
        NOT: {
          id: itemId,
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: any = { slug };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existingItem = await this.prisma.item.findUnique({
      where,
      select: { id: true },
    });

    return !!existingItem;
  }

  async validateSlug(slug: string, excludeId?: string): Promise<void> {
    const exists = await this.isSlugExists(slug, excludeId);
    if (exists) {
      throw new Error('An item with this slug already exists');
    }
  }
}
