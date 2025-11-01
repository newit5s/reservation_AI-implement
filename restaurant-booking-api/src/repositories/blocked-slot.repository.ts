import { BlockedSlot, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BlockedSlotRepository extends BaseRepository<Prisma.BlockedSlotUncheckedCreateInput, BlockedSlot> {
  constructor() {
    super((client) => client.blockedSlot);
  }

  async removeByBranch(branchId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.blockedSlot.deleteMany({
      where: {
        branchId,
        id: { in: ids },
      },
    });
  }
}
