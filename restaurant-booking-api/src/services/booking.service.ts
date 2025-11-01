import { differenceInCalendarDays } from 'date-fns';
import {
  Booking,
  BookingSource,
  BookingStatus,
  CustomerTier,
  Prisma,
  TimelineEventType,
} from '@prisma/client';
import { BookingRepository } from '../repositories/booking.repository';
import { TableRepository } from '../repositories/table.repository';
import { customerRepository } from '../repositories/customer.repository';
import { PermissionService } from './permission.service';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { BranchModel, BookingModel, CustomerModel } from '../models';
import { BookingAutomationService } from './booking-automation.service';
import { DatabaseService } from './database.service';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import { LoyaltyService } from './loyalty.service';
import { buildPaginatedResult, getPagination, timeStringToDate } from '../utils/helpers';

interface CreateBookingPayload {
  branchId: string;
  bookingDate: string;
  timeSlot: string;
  partySize: number;
  durationMinutes?: number;
  tableId?: string;
  source?: BookingSource;
  specialRequests?: string;
  internalNotes?: string;
  customerId?: string;
  customer?: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  autoWaitlist?: boolean;
}

interface UpdateBookingPayload {
  bookingDate?: string;
  timeSlot?: string;
  partySize?: number;
  durationMinutes?: number;
  tableId?: string | null;
  specialRequests?: string | null;
  internalNotes?: string | null;
}

interface BookingFilters {
  branchId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

type BookingWithCustomer = Prisma.BookingGetPayload<{ include: { customer: true } }>;

type CreateBookingResult =
  | { status: 'booked'; booking: BookingWithCustomer }
  | { status: 'waitlisted'; suggestions: { bookingDate: string; time: string }[] };

type BookingDetailed = Prisma.BookingGetPayload<{ include: { customer: true; table: true; branch: true } }>;

export class BookingService {
  private bookingRepository: BookingRepository;
  private tableRepository: TableRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.tableRepository = new TableRepository();
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(`Invalid ${field}`, 400);
    }
    return parsed;
  }

  private parseTime(value: string, field: string): Date {
    const parsed = timeStringToDate(value);
    if (!parsed) {
      throw new AppError(`Invalid ${field}`, 400);
    }
    return parsed;
  }

  private async resolveCustomer(payload: CreateBookingPayload): Promise<string | undefined> {
    if (payload.customerId) {
      const existing = await customerRepository.findById(payload.customerId);
      if (!existing) {
        throw new AppError('Customer not found', 404);
      }
      if (await CustomerModel.checkBlacklist(existing.id)) {
        throw new AppError('Customer is blacklisted and cannot book', 400);
      }
      return existing.id;
    }

    if (!payload.customer) {
      return undefined;
    }

    const prisma = DatabaseService.getClient();
    const created = await prisma.customer.create({
      data: {
        fullName: payload.customer.fullName,
        email: payload.customer.email ?? null,
        phone: payload.customer.phone ?? null,
      },
    });
    await LoyaltyService.ensureAccount(created.id);
    await CustomerModel.recordTimeline(
      created.id,
      TimelineEventType.BOOKING_CREATED,
      'Customer profile created during booking',
      {}
    );
    return created.id;
  }

  private async ensureTableCapacity(
    branchId: string,
    tableId: string | undefined,
    partySize: number
  ): Promise<string | undefined> {
    if (!tableId) {
      return undefined;
    }
    const table = await this.tableRepository.findById(tableId);
    if (!table || table.branchId !== branchId) {
      throw new AppError('Table not found for branch', 404);
    }
    if (!table.isActive) {
      throw new AppError('Table is inactive', 400);
    }
    if (partySize > table.capacity) {
      throw new AppError('Party size exceeds table capacity', 400);
    }
    return tableId;
  }

  private async sendConfirmationEmail(bookingId: string): Promise<void> {
    const prisma = DatabaseService.getClient();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, branch: true, table: true },
    });
    if (!booking?.customer?.email) {
      return;
    }
    await EmailService.sendEmail({
      to: booking.customer.email,
      subject: 'Your reservation confirmation',
      html: `Hi ${booking.customer.fullName}, your booking ${booking.bookingCode} is confirmed for ${booking.bookingDate.toISOString().split('T')[0]} at ${booking.timeSlot.toISOString().split('T')[1].substring(0, 5)}.`,
    });
  }

  async checkAvailabilityPublic(payload: {
    branchId: string;
    bookingDate: string;
    timeSlot: string;
    partySize: number;
  }): Promise<{ availableTables: number; suggestions: { bookingDate: string; time: string }[] }> {
    const bookingDate = this.parseDate(payload.bookingDate, 'booking date');
    const timeSlot = this.parseTime(payload.timeSlot, 'time slot');
    const available = await BranchModel.getAvailableTables(
      payload.branchId,
      bookingDate,
      timeSlot,
      payload.partySize
    );
    if (available.length > 0) {
      return { availableTables: available.length, suggestions: [] };
    }
    const suggestions = await BookingAutomationService.suggestAlternativeSlots(
      payload.branchId,
      bookingDate,
      timeSlot,
      payload.partySize
    );
    return { availableTables: 0, suggestions };
  }

  async checkAvailability(user: AuthUser, payload: {
    branchId: string;
    bookingDate: string;
    timeSlot: string;
    partySize: number;
  }): Promise<{ availableTables: number; suggestions: { bookingDate: string; time: string }[] }> {
    PermissionService.assertPermission(user, 'bookings', 'read', payload.branchId);
    return this.checkAvailabilityPublic(payload);
  }

  async createBooking(user: AuthUser, payload: CreateBookingPayload): Promise<CreateBookingResult> {
    PermissionService.assertPermission(user, 'bookings', 'create', payload.branchId);
    const bookingDate = this.parseDate(payload.bookingDate, 'booking date');
    const timeSlot = this.parseTime(payload.timeSlot, 'time slot');

    if (differenceInCalendarDays(bookingDate, new Date()) > 30) {
      throw new AppError('Bookings cannot be made more than 30 days in advance', 400);
    }

    if (!(await BranchModel.isOpen(payload.branchId, bookingDate, timeSlot))) {
      throw new AppError('Branch is closed for the selected time', 400);
    }

    const customerId = await this.resolveCustomer(payload);
    const tableId = await this.ensureTableCapacity(payload.branchId, payload.tableId, payload.partySize);

    const isAvailable = await BookingModel.checkAvailability(
      payload.branchId,
      tableId ?? null,
      bookingDate,
      timeSlot,
      payload.durationMinutes ?? 120
    );

    if (!isAvailable) {
      const suggestions = await BookingAutomationService.suggestAlternativeSlots(
        payload.branchId,
        bookingDate,
        timeSlot,
        payload.partySize
      );
      if (payload.autoWaitlist && customerId) {
        await BookingAutomationService.addToWaitlist({
          branchId: payload.branchId,
          bookingDate,
          timeSlot,
          partySize: payload.partySize,
          customerId,
          notes: payload.specialRequests,
        });
      }
      return { status: 'waitlisted', suggestions };
    }

    const bookingCode = await BookingModel.generateBookingCode();
    const prisma = DatabaseService.getClient();
    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        branchId: payload.branchId,
        bookingDate,
        timeSlot,
        durationMinutes: payload.durationMinutes ?? 120,
        partySize: payload.partySize,
        tableId: tableId ?? null,
        customerId: customerId ?? null,
        specialRequests: payload.specialRequests ?? null,
        internalNotes: payload.internalNotes ?? null,
        source: payload.source ?? BookingSource.ADMIN,
        createdById: user.id,
      },
      include: { customer: true },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: booking.id,
        action: 'BOOKING_CREATED',
        oldStatus: null,
        newStatus: BookingStatus.PENDING,
        changedById: user.id,
      },
    });

    if (booking.customerId) {
      await CustomerModel.recordTimeline(
        booking.customerId,
        TimelineEventType.BOOKING_CREATED,
        'Booking created',
        {
          bookingCode,
          branchId: payload.branchId,
          partySize: payload.partySize,
        },
        user.id
      );
    }

    const tier = booking.customerId
      ? await CustomerModel.calculateTier(booking.customerId)
      : CustomerTier.REGULAR;
    const autoConfirm = await BookingAutomationService.shouldAutoConfirm({
      branchId: payload.branchId,
      bookingDate,
      timeSlot,
      partySize: payload.partySize,
      customerTier: tier,
      hasSpecialRequests: Boolean(payload.specialRequests),
    });

    if (autoConfirm) {
      const confirmed = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: { customer: true },
      });
      await prisma.bookingHistory.create({
        data: {
          bookingId: booking.id,
          action: 'AUTO_CONFIRMED',
          oldStatus: BookingStatus.PENDING,
          newStatus: BookingStatus.CONFIRMED,
          changedById: user.id,
        },
      });
      await CustomerModel.updateStats(confirmed.customerId!);
      BookingAutomationService.scheduleNotifications(confirmed);
      await this.sendConfirmationEmail(confirmed.id);
      logger.info('Booking auto-confirmed', { bookingId: confirmed.id });
      return { status: 'booked', booking: confirmed };
    }

    logger.info('Booking created pending confirmation', { bookingId: booking.id });
    return { status: 'booked', booking };
  }

  async updateBooking(
    user: AuthUser,
    bookingId: string,
    payload: UpdateBookingPayload
  ): Promise<BookingWithCustomer> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    PermissionService.assertPermission(user, 'bookings', 'update', booking.branchId);

    const prisma = DatabaseService.getClient();
    const updateData: Prisma.BookingUncheckedUpdateInput = {};

    let bookingDate = booking.bookingDate;
    let timeSlot = booking.timeSlot;

    if (payload.bookingDate) {
      bookingDate = this.parseDate(payload.bookingDate, 'booking date');
      updateData.bookingDate = bookingDate;
    }
    if (payload.timeSlot) {
      timeSlot = this.parseTime(payload.timeSlot, 'time slot');
      updateData.timeSlot = timeSlot;
    }
    if (payload.partySize !== undefined) {
      updateData.partySize = payload.partySize;
    }
    if (payload.durationMinutes !== undefined) {
      updateData.durationMinutes = payload.durationMinutes;
    }
    if (payload.specialRequests !== undefined) {
      updateData.specialRequests = payload.specialRequests;
    }
    if (payload.internalNotes !== undefined) {
      updateData.internalNotes = payload.internalNotes;
    }

    if (payload.tableId !== undefined) {
      if (payload.tableId) {
        const partySize = payload.partySize ?? booking.partySize;
        const tableId = await this.ensureTableCapacity(booking.branchId, payload.tableId, partySize);
        updateData.tableId = tableId;
      } else {
        updateData.tableId = null;
      }
    }

    const duration = payload.durationMinutes ?? booking.durationMinutes ?? 120;
    const targetTableId =
      payload.tableId !== undefined ? payload.tableId ?? null : booking.tableId ?? null;
    const available = await BookingModel.checkAvailability(
      booking.branchId,
      targetTableId,
      bookingDate,
      timeSlot,
      duration
    );
    if (!available) {
      throw new AppError('The selected slot is no longer available', 400);
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: { customer: true },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_UPDATED',
        oldStatus: booking.status,
        newStatus: updated.status,
        changedById: user.id,
      },
    });

    if (updated.customerId) {
      await CustomerModel.recordTimeline(
        updated.customerId,
        TimelineEventType.BOOKING_UPDATED,
        'Booking details updated',
        { bookingId, bookingCode: updated.bookingCode },
        user.id
      );
    }

    return updated;
  }

  async getBookingByCode(code: string): Promise<BookingDetailed | null> {
    const prisma = DatabaseService.getClient();
    return prisma.booking.findUnique({
      where: { bookingCode: code },
      include: { customer: true, table: true, branch: true },
    });
  }

  async listBookings(user: AuthUser, filters: BookingFilters) {
    PermissionService.assertPermission(user, 'bookings', 'read', filters.branchId ?? user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const { skip, take } = getPagination({ page: filters.page, pageSize: filters.pageSize });
    const where: Prisma.BookingWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    } else {
      const accessible = PermissionService.getAccessibleBranches(user);
      if (accessible) {
        where.branchId = { in: accessible };
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.startDate || filters.endDate) {
      where.bookingDate = {
        ...(filters.startDate ? { gte: this.parseDate(filters.startDate, 'start date') } : {}),
        ...(filters.endDate ? { lte: this.parseDate(filters.endDate, 'end date') } : {}),
      };
    }
    if (filters.search) {
      where.OR = [
        { bookingCode: { contains: filters.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { bookingDate: 'desc' },
        include: { customer: true, table: true },
      }),
      prisma.booking.count({ where }),
    ]);

    return buildPaginatedResult(data, total, { page: filters.page, pageSize: filters.pageSize });
  }

  async confirmBooking(user: AuthUser, bookingId: string): Promise<BookingWithCustomer> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    PermissionService.assertPermission(user, 'bookings', 'update', booking.branchId);
    if (booking.status === BookingStatus.CONFIRMED) {
      const detailed = await DatabaseService.getClient().booking.findUnique({
        where: { id: bookingId },
        include: { customer: true },
      });
      if (!detailed) {
        throw new AppError('Booking not found', 404);
      }
      return detailed;
    }
    const prisma = DatabaseService.getClient();
    const confirmed = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED, confirmedAt: new Date() },
      include: { customer: true },
    });
    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_CONFIRMED',
        oldStatus: booking.status,
        newStatus: BookingStatus.CONFIRMED,
        changedById: user.id,
      },
    });
    if (confirmed.customerId) {
      await CustomerModel.updateStats(confirmed.customerId);
      BookingAutomationService.scheduleNotifications(confirmed);
      await this.sendConfirmationEmail(confirmed.id);
    }
    return confirmed;
  }

  async cancelBooking(
    user: AuthUser,
    bookingId: string,
    reason?: string
  ): Promise<BookingWithCustomer> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    PermissionService.assertPermission(user, 'bookings', 'update', booking.branchId);
    const prisma = DatabaseService.getClient();
    const cancelled = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: user.id,
        cancellationReason: reason ?? null,
      },
      include: { customer: true },
    });
    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_CANCELLED',
        oldStatus: booking.status,
        newStatus: BookingStatus.CANCELLED,
        changedById: user.id,
        notes: reason ?? undefined,
      },
    });
    if (cancelled.customerId) {
      await CustomerModel.updateStats(cancelled.customerId);
      await BookingAutomationService.trackCustomerActivity(
        cancelled,
        TimelineEventType.BOOKING_CANCELLED,
        'Booking cancelled',
        { reason }
      );
    }
    await BookingAutomationService.promoteWaitlist(
      booking.branchId,
      booking.bookingDate,
      booking.timeSlot
    );
    return cancelled;
  }

  async markNoShow(user: AuthUser, bookingId: string): Promise<BookingWithCustomer> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    PermissionService.assertPermission(user, 'bookings', 'update', booking.branchId);
    const prisma = DatabaseService.getClient();
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.NO_SHOW },
      include: { customer: true },
    });
    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_NO_SHOW',
        oldStatus: booking.status,
        newStatus: BookingStatus.NO_SHOW,
        changedById: user.id,
      },
    });
    if (updated.customerId) {
      await CustomerModel.updateStats(updated.customerId);
      await BookingAutomationService.trackCustomerActivity(
        updated,
        TimelineEventType.BOOKING_CANCELLED,
        'Booking marked as no-show'
      );
    }
    return updated;
  }

  async checkIn(user: AuthUser, bookingId: string): Promise<BookingWithCustomer> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    PermissionService.assertPermission(user, 'bookings', 'update', booking.branchId);
    const prisma = DatabaseService.getClient();
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CHECKED_IN, checkedInAt: new Date() },
      include: { customer: true },
    });
    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_CHECKED_IN',
        oldStatus: booking.status,
        newStatus: BookingStatus.CHECKED_IN,
        changedById: user.id,
      },
    });
    if (updated.customerId) {
      await BookingAutomationService.trackCustomerActivity(
        updated,
        TimelineEventType.CHECKED_IN,
        'Customer checked in'
      );
    }
    return updated;
  }

  async completeBooking(bookingId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    const prisma = DatabaseService.getClient();
    const completed = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED, updatedAt: new Date() },
      include: { customer: true },
    });
    await prisma.bookingHistory.create({
      data: {
        bookingId,
        action: 'BOOKING_COMPLETED',
        oldStatus: booking.status,
        newStatus: BookingStatus.COMPLETED,
      },
    });
    if (completed.customerId) {
      await CustomerModel.updateStats(completed.customerId);
      await LoyaltyService.awardPoints(completed.customerId, {
        reason: 'Completed reservation',
        points: 1,
        metadata: { bookingId },
      });
      await LoyaltyService.adjustTier(completed.customerId);
      await BookingAutomationService.trackCustomerActivity(
        completed,
        TimelineEventType.COMPLETED,
        'Booking completed'
      );
    }
  }

  async getUpcoming(user: AuthUser, branchId: string) {
    PermissionService.assertPermission(user, 'bookings', 'read', branchId);
    return this.bookingRepository.getUpcoming(branchId);
  }

  async processAutoCancellation(): Promise<number> {
    return BookingModel.autoCancel();
  }
}
