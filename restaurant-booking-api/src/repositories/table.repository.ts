import { Prisma, Table } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TableRepository extends BaseRepository<
  Prisma.TableUncheckedCreateInput,
  Table,
  Prisma.TableUpdateInput
> {
  constructor() {
    super((client) => client.table);
  }

  async findByBranch(branchId: string): Promise<Table[]> {
    return this.delegate.findMany({
      where: { branchId },
      orderBy: [{ floor: 'asc' }, { tableNumber: 'asc' }],
    });
  }
}
