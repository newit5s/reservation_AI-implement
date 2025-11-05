import { addDays, eachDayOfInterval, formatISO, startOfDay, subDays } from 'date-fns';
import { BookingStatus } from '@prisma/client';
import { DatabaseService } from './database.service';

export interface BranchSummaryMetrics {
  branchId: string;
  date: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowRate: number;
  upcomingArrivals: number;
  checkedInGuests: number;
  totalCapacity: number;
  occupancyRate: number;
}

export interface BranchTrendPoint {
  date: string;
  totalBookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export class AnalyticsService {
  private client = DatabaseService.getClient();

  async getBranchSummary(branchId: string, referenceDate = new Date()): Promise<BranchSummaryMetrics> {
    const start = startOfDay(referenceDate);
    const end = addDays(start, 1);

    const [todayBookings, capacityResult] = await Promise.all([
      this.client.booking.findMany({
        where: {
          branchId,
          bookingDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          status: true,
          partySize: true,
          bookingDate: true,
          timeSlot: true,
        },
      }),
      this.client.table.aggregate({
        where: {
          branchId,
          isActive: true,
        },
        _sum: {
          capacity: true,
        },
      }),
    ]);

    const now = new Date(referenceDate);

    let completedBookings = 0;
    let cancelledBookings = 0;
    let noShowBookings = 0;
    let checkedInGuests = 0;
    let upcomingArrivals = 0;

    todayBookings.forEach((booking) => {
      const { status, partySize } = booking;

      if (status === BookingStatus.COMPLETED) {
        completedBookings += 1;
      }
      if (status === BookingStatus.CANCELLED) {
        cancelledBookings += 1;
      }
      if (status === BookingStatus.NO_SHOW) {
        noShowBookings += 1;
      }
      if (status === BookingStatus.CHECKED_IN) {
        checkedInGuests += partySize ?? 0;
      }
      if (status === BookingStatus.PENDING || status === BookingStatus.CONFIRMED) {
        const scheduled = new Date(booking.bookingDate);
        scheduled.setHours(booking.timeSlot.getHours(), booking.timeSlot.getMinutes(), 0, 0);
        if (scheduled >= now) {
          upcomingArrivals += 1;
        }
      }
    });

    const totalBookings = todayBookings.length;
    const totalCapacity = capacityResult._sum.capacity ?? 0;
    const occupancyRate = totalCapacity > 0 ? Math.min(checkedInGuests / totalCapacity, 1) : 0;
    const noShowRate = totalBookings > 0 ? noShowBookings / totalBookings : 0;

    return {
      branchId,
      date: start.toISOString(),
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowRate,
      upcomingArrivals,
      checkedInGuests,
      totalCapacity,
      occupancyRate,
    };
  }

  async getBranchTrends(branchId: string, days = 7, referenceDate = new Date()): Promise<BranchTrendPoint[]> {
    const safeDays = Math.max(1, Math.min(days, 30));
    const end = addDays(startOfDay(referenceDate), 1);
    const start = startOfDay(subDays(end, safeDays));

    const bookings = await this.client.booking.findMany({
      where: {
        branchId,
        bookingDate: {
          gte: start,
          lt: end,
        },
      },
      select: {
        bookingDate: true,
        status: true,
      },
    });

    const interval = eachDayOfInterval({ start, end: addDays(start, safeDays - 1) });
    const grouped = interval.map<BranchTrendPoint>((day) => {
      const dayKey = formatISO(day, { representation: 'date' });
      const stats = bookings.filter((booking) => formatISO(booking.bookingDate, { representation: 'date' }) === dayKey);

      const total = stats.length;
      const completed = stats.filter((item) => item.status === BookingStatus.COMPLETED).length;
      const cancelled = stats.filter((item) => item.status === BookingStatus.CANCELLED).length;
      const noShow = stats.filter((item) => item.status === BookingStatus.NO_SHOW).length;

      return {
        date: dayKey,
        totalBookings: total,
        completed,
        cancelled,
        noShow,
      };
    });

    return grouped;
  }
}

export const analyticsService = new AnalyticsService();
