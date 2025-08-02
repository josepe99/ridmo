import { BaseDatasource, PaginationOptions, PaginatedResult } from './base.datasource';

export interface CollectionCreateData {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CollectionUpdateData extends Partial<CollectionCreateData> {}

export class CollectionDatasource extends BaseDatasource {
  async findMany(
    options: PaginationOptions & {
      isActive?: boolean;
    } = {}
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      isActive,
    } = options;

    const where: any = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // MongoDB pagination
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: {
          items: {
            where: { isActive: true },
            take: 5, // Just get a few items for preview
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              comparePrice: true,
              images: true, // Include images array
              tags: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.collection.count({
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
    includeItems: boolean = true
  ): Promise<any | null> {
    return await this.prisma.collection.findUnique({
      where: { id },
      include: includeItems ? {
        items: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      } : undefined,
    });
  }

  async findBySlug(
    slug: string,
    includeItems: boolean = true
  ): Promise<any | null> {
    return await this.prisma.collection.findUnique({
      where: { slug },
      include: includeItems ? {
        items: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      } : undefined,
    });
  }

  async create(data: CollectionCreateData): Promise<any> {
    return await this.prisma.collection.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: CollectionUpdateData): Promise<any> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await this.prisma.collection.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<any> {
    return await this.prisma.collection.delete({
      where: { id },
    });
  }

  async getActiveCollections(): Promise<any[]> {
    return await this.prisma.collection.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          where: { isActive: true },
          take: 3, // Just get a few items for preview
          orderBy: { createdAt: 'desc' }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCollectionWithItems(
    slug: string,
    itemsPage: number = 1,
    itemsLimit: number = 12
  ): Promise<any | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
    });

    if (!collection) {
      return null;
    }

    const skip = (itemsPage - 1) * itemsLimit;

    const [items, itemsTotal] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          collectionId: collection.id,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: itemsLimit,
      }),
      this.prisma.item.count({
        where: {
          collectionId: collection.id,
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(itemsTotal / itemsLimit);

    return {
      ...collection,
      items: {
        data: items,
        pagination: {
          page: itemsPage,
          limit: itemsLimit,
          total: itemsTotal,
          totalPages,
          hasNext: itemsPage < totalPages,
          hasPrev: itemsPage > 1,
        },
      },
    };
  }
}
