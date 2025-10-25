import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TableRepository extends BaseRepository<Prisma.TableUncheckedCreateInput> {
  constructor() {
    super((client) => client.table);
  }

  async findByBranch(branchId: string) {
    return this.delegate.findMany({
      where: { branchId },
      orderBy: [{ floor: 'asc' }, { tableNumber: 'asc' }],
    });
  }
}
