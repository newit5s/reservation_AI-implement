import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class OperatingHourRepository extends BaseRepository<Prisma.OperatingHourUncheckedCreateInput> {
  constructor() {
    super((client) => client.operatingHour);
  }

  async upsertMany(branchId: string, hours: Prisma.OperatingHourUncheckedCreateInput[]) {
    await Promise.all(
      hours.map((hour) =>
        this.delegate.upsert({
          where: {
            branchId_dayOfWeek: {
              branchId,
              dayOfWeek: hour.dayOfWeek,
            },
          },
          create: hour,
          update: hour,
        })
      )
    );
  }
}
