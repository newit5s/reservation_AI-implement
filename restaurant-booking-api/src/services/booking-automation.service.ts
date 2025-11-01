import { addHours, addMinutes } from 'date-fns';
import {
  Booking,
  BookingStatus,
  CustomerTier,
  TimelineEventType,
  WaitlistStatus,
} from '@prisma/client';
import { BranchModel, BookingModel, CustomerModel } from '../models';
import { DatabaseService } from './database.service';
import { EmailService } from './email.service';
import { JobScheduler } from './job-queue.service';

interface AutoConfirmationContext {
  branchId: string;
  bookingDate: Date;
  timeSlot: Date;
  partySize: number;
  customerTier: CustomerTier;
  hasSpecialRequests: boolean;
}

interface WaitlistPayload {
  branchId: string;
  bookingDate: Date;
  timeSlot: Date;
  partySize: number;
  customerId?: string;
  notes?: string;
}

export class BookingAutomationService {
  static async shouldAutoConfirm(context: AutoConfirmationContext): Promise<boolean> {
    if (context.customerTier === CustomerTier.VIP) {
      return true;
    }

    if (context.hasSpecialRequests) {
      return false;
    }

    const prisma = DatabaseService.getClient();
    const [availableTables, totalTables] = await Promise.all([
      BranchModel.getAvailableTables(context.branchId, context.bookingDate, context.timeSlot, context.partySize),
      prisma.table.count({ where: { branchId: context.branchId, isActive: true } }),
    ]);

    if (totalTables === 0) {
      return false;
    }

    const availabilityRatio = availableTables.length / totalTables;
    return availabilityRatio >= 0.5;
  }

  static async suggestAlternativeSlots(
    branchId: string,
    bookingDate: Date,
    timeSlot: Date,
    partySize: number
  ): Promise<{ bookingDate: string; time: string }[]> {
    const suggestions: { bookingDate: string; time: string }[] = [];
    const intervals = [-60, -30, 30, 60, 90, 120];

    for (const offset of intervals) {
      const candidate = addMinutes(timeSlot, offset);
      const isAvailable = await BookingModel.checkAvailability(branchId, null, bookingDate, candidate, 120);
      if (isAvailable) {
        suggestions.push({
          bookingDate: bookingDate.toISOString().split('T')[0],
          time: candidate.toISOString().split('T')[1].substring(0, 5),
        });
      }
      if (suggestions.length >= 3) {
        break;
      }
    }

    return suggestions;
  }

  static async addToWaitlist(payload: WaitlistPayload): Promise<void> {
    const prisma = DatabaseService.getClient();
    await prisma.waitlistEntry.create({
      data: {
        branchId: payload.branchId,
        bookingDate: payload.bookingDate,
        timeSlot: payload.timeSlot,
        partySize: payload.partySize,
        customerId: payload.customerId ?? null,
        notes: payload.notes ?? null,
      },
    });

    if (payload.customerId) {
      await CustomerModel.recordTimeline(
        payload.customerId,
        TimelineEventType.WAITLIST_JOINED,
        'Customer added to waitlist',
        {
          branchId: payload.branchId,
          bookingDate: payload.bookingDate,
          timeSlot: payload.timeSlot,
        }
      );
    }
  }

  static async promoteWaitlist(branchId: string, bookingDate: Date, timeSlot: Date): Promise<void> {
    const prisma = DatabaseService.getClient();
    const entry = await prisma.waitlistEntry.findFirst({
      where: {
        branchId,
        bookingDate,
        timeSlot,
        status: WaitlistStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!entry) {
      return;
    }

    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.NOTIFIED },
    });

    if (entry.customerId) {
      await CustomerModel.recordTimeline(
        entry.customerId,
        TimelineEventType.WAITLIST_PROMOTED,
        'Waitlist slot became available',
        { branchId, bookingDate, timeSlot }
      );
    }
  }

  static scheduleNotifications(booking: Booking & { customer?: { email: string | null; fullName: string } | null }): void {
    if (!booking.customer?.email) {
      return;
    }

    const scheduler = JobScheduler.getInstance();
    const bookingStart = new Date(
      booking.bookingDate.getFullYear(),
      booking.bookingDate.getMonth(),
      booking.bookingDate.getDate(),
      booking.timeSlot.getHours(),
      booking.timeSlot.getMinutes(),
      booking.timeSlot.getSeconds()
    );

    const reminders = [
      { idSuffix: '24h', offsetMinutes: -24 * 60, subject: 'Booking Reminder (24h)' },
      { idSuffix: '2h', offsetMinutes: -120, subject: 'Booking Reminder (2h)' },
    ];

    reminders.forEach((reminder) => {
      const runAt = addMinutes(bookingStart, reminder.offsetMinutes);
      scheduler.schedule(`booking:${booking.id}:${reminder.idSuffix}`, runAt, async () => {
        await EmailService.sendEmail({
          to: booking.customer!.email!,
          subject: reminder.subject,
          html: `Hi ${booking.customer!.fullName}, this is a reminder for your reservation ${booking.bookingCode}.`,
        });
      });
    });

    const thankYouAt = addHours(bookingStart, 3);
    scheduler.schedule(`booking:${booking.id}:thankyou`, thankYouAt, async () => {
      await EmailService.sendEmail({
        to: booking.customer!.email!,
        subject: 'Thanks for dining with us!',
        html: `We hope you enjoyed your visit on ${booking.bookingDate.toISOString().split('T')[0]}.`,
      });
    });
  }

  static async trackCustomerActivity(
    booking: Booking,
    event: TimelineEventType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    if (!booking.customerId) {
      return;
    }
    await CustomerModel.recordTimeline(booking.customerId, event, description, {
      ...metadata,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
    });
  }

  static async flagBehaviour(booking: Booking, status: BookingStatus): Promise<void> {
    if (!booking.customerId) {
      return;
    }
    await CustomerModel.updateStats(booking.customerId);
    const eventMap: Record<BookingStatus, TimelineEventType> = {
      [BookingStatus.PENDING]: TimelineEventType.BOOKING_UPDATED,
      [BookingStatus.CONFIRMED]: TimelineEventType.BOOKING_CONFIRMED,
      [BookingStatus.CHECKED_IN]: TimelineEventType.CHECKED_IN,
      [BookingStatus.COMPLETED]: TimelineEventType.COMPLETED,
      [BookingStatus.CANCELLED]: TimelineEventType.BOOKING_CANCELLED,
      [BookingStatus.NO_SHOW]: TimelineEventType.BOOKING_CANCELLED,
    };
    await this.trackCustomerActivity(booking, eventMap[status], `Booking status changed to ${status}`, {});
  }
}
