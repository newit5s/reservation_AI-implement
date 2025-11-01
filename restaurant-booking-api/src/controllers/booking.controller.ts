import { Request, Response } from 'express';
import { BookingStatus } from '@prisma/client';
import { BookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../types/requests';
import {
  BookingListQuery,
  CancelBookingBody,
  CreateBookingBody,
  PublicAvailabilityBody,
  UpcomingBookingsQuery,
  UpdateBookingBody,
} from '../validations/booking.validation';

const bookingService = new BookingService();

export class BookingController {
  static async publicAvailability(
    req: Request<Record<string, never>, unknown, PublicAvailabilityBody>,
    res: Response
  ): Promise<void> {
    const payload: PublicAvailabilityBody = req.body;
    const result = await bookingService.checkAvailabilityPublic(payload);
    res.json(result);
  }

  static async availability(
    req: AuthenticatedRequest<Record<string, never>, unknown, PublicAvailabilityBody>,
    res: Response
  ): Promise<void> {
    const payload: PublicAvailabilityBody = req.body;
    const result = await bookingService.checkAvailability(req.user, payload);
    res.json(result);
  }

  static async create(
    req: AuthenticatedRequest<Record<string, never>, unknown, CreateBookingBody>,
    res: Response
  ): Promise<void> {
    const payload: CreateBookingBody = req.body;
    const result = await bookingService.createBooking(req.user, {
      ...payload,
      tableId: payload.tableId ?? undefined,
    });
    if (result.status === 'waitlisted') {
      res.status(202).json(result);
      return;
    }
    res.status(201).json(result.booking);
  }

  static async update(
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateBookingBody>,
    res: Response
  ): Promise<void> {
    const payload: UpdateBookingBody = req.body;
    const booking = await bookingService.updateBooking(req.user, req.params.id, payload);
    res.json(booking);
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query = req.query as BookingListQuery;
    const filters = {
      branchId: query.branchId,
      status: query.status as BookingStatus | undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      search: query.search,
      page: query.page !== undefined ? Number(query.page) : undefined,
      pageSize: query.pageSize !== undefined ? Number(query.pageSize) : undefined,
    };
    const bookings = await bookingService.listBookings(req.user, filters);
    res.json(bookings);
  }

  static async getByCode(req: Request<{ code: string }>, res: Response): Promise<void> {
    const booking = await bookingService.getBookingByCode(req.params.code);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    res.json(booking);
  }

  static async confirm(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const booking = await bookingService.confirmBooking(req.user, req.params.id);
    res.json(booking);
  }

  static async cancel(
    req: AuthenticatedRequest<{ id: string }, unknown, CancelBookingBody>,
    res: Response
  ): Promise<void> {
    const payload: CancelBookingBody = req.body;
    const booking = await bookingService.cancelBooking(req.user, req.params.id, payload?.reason);
    res.json(booking);
  }

  static async noShow(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const booking = await bookingService.markNoShow(req.user, req.params.id);
    res.json(booking);
  }

  static async checkIn(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const booking = await bookingService.checkIn(req.user, req.params.id);
    res.json(booking);
  }

  static async upcoming(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query = req.query as UpcomingBookingsQuery;
    const bookings = await bookingService.getUpcoming(req.user, query.branchId);
    res.json(bookings);
  }
}
