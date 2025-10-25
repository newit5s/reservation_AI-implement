import { addMinutes, isAfter, startOfDay } from 'date-fns';
import { BookingStatus } from '@prisma/client';
import { DatabaseService } from '../services/database.service';

const prisma = () => DatabaseService.getClient();

const combineDateAndTime = (date: Date, time: Date): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );

export class CustomerModel {
  static async calculateTier(customerId: string): Promise<'REGULAR' | 'VIP'> {
    const customer = await prisma().customer.findUnique({
      where: { id: customerId },
      select: { successfulBookings: true },
    });
    if (!customer) {
      return 'REGULAR';
    }
    return customer.successfulBookings >= 10 ? 'VIP' : 'REGULAR';
  }

  static async checkBlacklist(customerId: string): Promise<boolean> {
    const customer = await prisma().customer.findUnique({
      where: { id: customerId },
      select: { isBlacklisted: true },
    });
    return customer?.isBlacklisted ?? false;
  }

  static async getBookingStats(customerId: string) {
    const bookings = await prisma().booking.groupBy({
      by: ['status'],
      where: { customerId },
      _count: { _all: true },
    });

    return bookings.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});
  }

  static async updateStats(customerId: string): Promise<void> {
    const stats = await CustomerModel.getBookingStats(customerId);
    const successful = stats[BookingStatus.COMPLETED] ?? 0;
    const cancelled = stats[BookingStatus.CANCELLED] ?? 0;
    const noShow = stats[BookingStatus.NO_SHOW] ?? 0;

    await prisma().customer.update({
      where: { id: customerId },
      data: {
        successfulBookings: successful,
        cancellations: cancelled,
        noShows: noShow,
        totalBookings: Object.values(stats).reduce((acc, count) => acc + count, 0),
        tier: successful >= 10 ? 'VIP' : 'REGULAR',
      },
    });
  }
}

export class BookingModel {
  private static generateCandidateCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i += 1) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  }

  static async generateBookingCode(): Promise<string> {
    let code = BookingModel.generateCandidateCode();
    // Ensure uniqueness
    while (await prisma().booking.findUnique({ where: { bookingCode: code } })) {
      code = BookingModel.generateCandidateCode();
    }
    return code;
  }

  static async checkAvailability(
    branchId: string,
    tableId: string | null,
    bookingDate: Date,
    timeSlot: Date,
    durationMinutes = 120
  ): Promise<boolean> {
    const start = combineDateAndTime(bookingDate, timeSlot);
    const end = addMinutes(start, durationMinutes);

    const bookings = await prisma().booking.findMany({
      where: {
        branchId,
        bookingDate,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        ...(tableId ? { tableId } : {}),
      },
      select: { bookingDate: true, timeSlot: true, durationMinutes: true },
    });

    const hasOverlap = bookings.some((booking) => {
      const existingStart = combineDateAndTime(booking.bookingDate, booking.timeSlot);
      const existingEnd = addMinutes(existingStart, booking.durationMinutes ?? durationMinutes);
      return existingStart < end && existingEnd > start;
    });

    if (hasOverlap) {
      return false;
    }

    const blockedSlots = await prisma().blockedSlot.findMany({
      where: { branchId, date: bookingDate },
    });

    const blocked = blockedSlots.some((slot) => {
      const blockedStart = combineDateAndTime(slot.date, slot.startTime);
      const blockedEnd = combineDateAndTime(slot.date, slot.endTime);
      return blockedStart < end && blockedEnd > start;
    });

    return !blocked;
  }

  static async autoCancel(): Promise<number> {
    const now = new Date();
    const bookings = await prisma().booking.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, bookingDate: true, timeSlot: true },
    });

    const overdue = bookings.filter((booking) => {
      const start = combineDateAndTime(booking.bookingDate, booking.timeSlot);
      return addMinutes(start, 15) < now;
    });

    if (!overdue.length) {
      return 0;
    }

    const result = await prisma().booking.updateMany({
      where: { id: { in: overdue.map((booking) => booking.id) } },
      data: { status: 'NO_SHOW' },
    });
    return result.count;
  }

  static async getUpcoming(branchId: string) {
    const today = startOfDay(new Date());
    return prisma().booking.findMany({
      where: {
        branchId,
        bookingDate: { gte: today },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: [{ bookingDate: 'asc' }, { timeSlot: 'asc' }],
    });
  }

  static async getByDateRange(branchId: string, start: Date, end: Date) {
    return prisma().booking.findMany({
      where: {
        branchId,
        bookingDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [{ bookingDate: 'asc' }, { timeSlot: 'asc' }],
    });
  }
}

export class TableModel {
  static async isAvailable(tableId: string, date: Date, time: Date): Promise<boolean> {
    const table = await prisma().table.findUnique({
      where: { id: tableId },
      select: { branchId: true },
    });
    if (!table) {
      return false;
    }
    return BookingModel.checkAvailability(table.branchId, tableId, date, time);
  }

  static async getBookingsForDate(tableId: string, date: Date) {
    return prisma().booking.findMany({
      where: { tableId, bookingDate: date },
      orderBy: { timeSlot: 'asc' },
    });
  }

  static async canCombineWith(tableId: string, otherTableId: string): Promise<boolean> {
    const [table, other] = await prisma().table.findMany({
      where: { id: { in: [tableId, otherTableId] } },
      select: { branchId: true, isCombinable: true },
    });
    if (!table || !other) {
      return false;
    }
    return table.branchId === other.branchId && table.isCombinable && other.isCombinable;
  }
}

export class BranchModel {
  static async isOpen(branchId: string, date: Date, time: Date): Promise<boolean> {
    const dayOfWeek = date.getUTCDay();
    const hours = await prisma().operatingHour.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek,
        },
      },
    });
    if (!hours || hours.isClosed) {
      return false;
    }
    const openTime = hours.openTime ?? null;
    const closeTime = hours.closeTime ?? null;
    if (!openTime || !closeTime) {
      return false;
    }
    const openAt = combineDateAndTime(date, openTime);
    const closeAt = combineDateAndTime(date, closeTime);
    return isAfter(time, openAt) && isAfter(closeAt, time);
  }

  static async getOperatingHours(branchId: string, dayOfWeek: number) {
    return prisma().operatingHour.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek,
        },
      },
    });
  }

  static async getAvailableTables(branchId: string, date: Date, time: Date, partySize: number) {
    const tables = await prisma().table.findMany({
      where: {
        branchId,
        capacity: { gte: partySize },
        isActive: true,
      },
      orderBy: { capacity: 'asc' },
    });

    const results = await Promise.all(
      tables.map(async (table) => ({
        table,
        available: await BookingModel.checkAvailability(branchId, table.id, date, time, 120),
      }))
    );

    return results.filter((item) => item.available).map((item) => item.table);
  }
}
