import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PaginationOptions } from '../types';

export class BranchRepository extends BaseRepository<Prisma.BranchUncheckedCreateInput> {
  constructor() {
    super((client) => client.branch);
  }

  async list(options: PaginationOptions, where: Prisma.BranchWhereInput = {}) {
    return this.paginate(options, {
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithDetails(id: string) {
    return this.delegate.findUnique({
      where: { id },
      include: {
        operatingHours: true,
        blockedSlots: true,
        settingsEntries: true,
      },
    });
  }
}
