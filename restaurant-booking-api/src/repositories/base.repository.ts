import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../services/database.service';
import { PaginationOptions } from '../types';
import { buildPaginatedResult, getPagination } from '../utils/helpers';

type Delegate<TCreate, TUpdate, TEntity> = {
  findUnique(...args: unknown[]): Promise<TEntity | null>;
  findMany(...args: unknown[]): Promise<TEntity[]>;
  create(...args: unknown[]): Promise<TEntity>;
  update(...args: unknown[]): Promise<TEntity>;
  delete(...args: unknown[]): Promise<TEntity>;
  count(...args: unknown[]): Promise<number>;
};

export class BaseRepository<TCreate, TEntity = TCreate, TUpdate = Partial<TCreate>> {
  protected prisma: PrismaClient;
  protected delegate: Delegate<TCreate, TUpdate, TEntity>;

  constructor(modelAccessor: (client: PrismaClient) => Delegate<TCreate, TUpdate, TEntity>) {
    this.prisma = DatabaseService.getClient();
    this.delegate = modelAccessor(this.prisma);
  }

  async findById(id: string): Promise<TEntity | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findMany(args: Record<string, unknown> = {}): Promise<TEntity[]> {
    return this.delegate.findMany(args);
  }

  async create(data: TCreate): Promise<TEntity> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: TUpdate): Promise<TEntity> {
    return this.delegate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<TEntity> {
    return this.delegate.delete({ where: { id } });
  }

  async paginate(options: PaginationOptions, args: Record<string, unknown> = {}) {
    const { skip, take } = getPagination(options);
    const [data, total] = await Promise.all([
      this.delegate.findMany({ ...args, skip, take }),
      this.delegate.count({ where: args.where ?? {} }),
    ]);

    return buildPaginatedResult(data, total, options);
  }
}
