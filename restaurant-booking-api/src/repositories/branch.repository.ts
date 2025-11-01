import { Branch, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PaginationOptions } from '../types';

type BranchWithRelations = Prisma.BranchGetPayload<{
  include: { operatingHours: true; blockedSlots: true; settingsEntries: true };
}>;

export class BranchRepository extends BaseRepository<
  Prisma.BranchUncheckedCreateInput,
  Branch,
  Prisma.BranchUpdateInput
> {
  constructor() {
    super((client) => client.branch);
  }

  async list(options: PaginationOptions, where: Prisma.BranchWhereInput = {}) {
    return this.paginate(options, {
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithDetails(id: string): Promise<BranchWithRelations | null> {
    return this.delegate.findUnique({
      where: { id },
      include: {
        operatingHours: true,
        blockedSlots: true,
        settingsEntries: true,
      },
    }) as Promise<BranchWithRelations | null>;
  }
}
