import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../services/database.service';
import { PaginationOptions } from '../types';
import { buildPaginatedResult, getPagination } from '../utils/helpers';

type Delegate<TModel> = {
  findUnique(args: Record<string, unknown>): Promise<TModel | null>;
  findMany(args: Record<string, unknown>): Promise<TModel[]>;
  create(args: { data: TModel }): Promise<TModel>;
  update(args: { where: Record<string, unknown>; data: Partial<TModel> }): Promise<TModel>;
  delete(args: { where: Record<string, unknown> }): Promise<TModel>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
};

export class BaseRepository<TModel> {
  protected prisma: PrismaClient;
  protected delegate: Delegate<TModel>;

  constructor(modelAccessor: (client: PrismaClient) => Delegate<TModel>) {
    this.prisma = DatabaseService.getClient();
    this.delegate = modelAccessor(this.prisma);
  }

  async findById(id: string) {
    return this.delegate.findUnique({ where: { id } });
  }

  async findMany(args: Record<string, unknown> = {}) {
    return this.delegate.findMany(args);
  }

  async create(data: TModel) {
    return this.delegate.create({ data });
  }

  async update(id: string, data: Partial<TModel>) {
    return this.delegate.update({ where: { id }, data });
  }

  async delete(id: string) {
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
