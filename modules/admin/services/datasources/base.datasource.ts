import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface QueryOptions {
  include?: Record<string, any>;
  select?: Record<string, any>;
  where?: Record<string, any>;
  orderBy?: Record<string, any>;
  skip?: number;
  take?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseDatasource {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  protected async findMany<T>(
    model: any,
    options: QueryOptions & PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, ...queryOptions } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        ...queryOptions,
        skip,
        take: limit,
      }),
      model.count({
        where: queryOptions.where,
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

  protected async findUnique<T>(
    model: any,
    options: QueryOptions
  ): Promise<T | null> {
    return await model.findUnique(options);
  }

  protected async findFirst<T>(
    model: any,
    options: QueryOptions
  ): Promise<T | null> {
    return await model.findFirst(options);
  }

  protected async create<T>(
    model: any,
    data: any,
    options: Omit<QueryOptions, 'where' | 'skip' | 'take'> = {}
  ): Promise<T> {
    return await model.create({
      data,
      ...options,
    });
  }

  protected async update<T>(
    model: any,
    where: Record<string, any>,
    data: any,
    options: Omit<QueryOptions, 'where' | 'skip' | 'take'> = {}
  ): Promise<T> {
    return await model.update({
      where,
      data,
      ...options,
    });
  }

  protected async upsert<T>(
    model: any,
    where: Record<string, any>,
    create: any,
    update: any,
    options: Omit<QueryOptions, 'where' | 'skip' | 'take'> = {}
  ): Promise<T> {
    return await model.upsert({
      where,
      create,
      update,
      ...options,
    });
  }

  protected async delete<T>(
    model: any,
    where: Record<string, any>
  ): Promise<T> {
    return await model.delete({
      where,
    });
  }

  protected async deleteMany(
    model: any,
    where: Record<string, any>
  ): Promise<{ count: number }> {
    return await model.deleteMany({
      where,
    });
  }

  protected async count(
    model: any,
    where: Record<string, any> = {}
  ): Promise<number> {
    return await model.count({
      where,
    });
  }

  protected async aggregate(
    model: any,
    options: {
      where?: Record<string, any>;
      _count?: Record<string, boolean>;
      _sum?: Record<string, boolean>;
      _avg?: Record<string, boolean>;
      _min?: Record<string, boolean>;
      _max?: Record<string, boolean>;
    }
  ): Promise<any> {
    return await model.aggregate(options);
  }

  protected async transaction<T>(
    operations: ((prisma: any) => Promise<T>)[]
  ): Promise<T[]> {
    return await this.prisma.$transaction(async (tx) => {
      return Promise.all(operations.map(op => op(tx)));
    });
  }
}
