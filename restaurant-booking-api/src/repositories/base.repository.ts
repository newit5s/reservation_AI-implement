import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../services/database.service';
import { PaginationOptions } from '../types';
import { buildPaginatedResult, getPagination } from '../utils/helpers';

export class BaseRepository<TModel> {
  protected prisma: PrismaClient;
  protected delegate: any;

  constructor(modelAccessor: (client: PrismaClient) => any) {
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
      this.delegate.count({ where: args.where ?? {} })
    ]);

    return buildPaginatedResult(data, total, options);
  }
}
