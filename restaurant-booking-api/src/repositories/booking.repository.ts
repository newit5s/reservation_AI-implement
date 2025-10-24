import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { BookingModel } from '../models';

export class BookingRepository extends BaseRepository<Prisma.BookingCreateInput> {
  constructor() {
    super((client) => client.booking);
  }

  async findAvailableSlots(branchId: string, date: Date, time: Date, partySize: number) {
    const tables = await this.prisma.table.findMany({
      where: { branchId, capacity: { gte: partySize }, isActive: true }
    });

    const availability = await Promise.all(
      tables.map(async (table) => ({
        tableId: table.id,
        available: await BookingModel.checkAvailability(branchId, table.id, date, time, 120)
      }))
    );

    return availability.filter((item) => item.available);
  }

  async getUpcoming(branchId: string) {
    return BookingModel.getUpcoming(branchId);
  }

  async getByDateRange(branchId: string, start: Date, end: Date) {
    return BookingModel.getByDateRange(branchId, start, end);
  }

  async autoCancelOverdue() {
    return BookingModel.autoCancel();
  }
}

export const bookingRepository = new BookingRepository();
