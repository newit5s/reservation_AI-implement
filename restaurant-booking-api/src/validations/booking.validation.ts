import { BookingSource, BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const publicAvailabilitySchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    bookingDate: z.string().min(1),
    timeSlot: z.string().min(1),
    partySize: z.number().int().positive(),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    bookingDate: z.string().min(1),
    timeSlot: z.string().min(1),
    partySize: z.number().int().positive(),
    durationMinutes: z.number().int().positive().optional(),
    tableId: z.string().uuid().nullable().optional(),
    source: z.nativeEnum(BookingSource).optional(),
    specialRequests: z.string().max(500).optional(),
    internalNotes: z.string().optional(),
    customerId: z.string().uuid().optional(),
    customer: z
      .object({
        fullName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().min(6).max(20).optional(),
      })
      .optional(),
    autoWaitlist: z.boolean().optional(),
  }),
});

export const updateBookingSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    bookingDate: z.string().optional(),
    timeSlot: z.string().optional(),
    partySize: z.number().int().positive().optional(),
    durationMinutes: z.number().int().positive().optional(),
    tableId: z.string().uuid().nullable().optional(),
    specialRequests: z.string().nullable().optional(),
    internalNotes: z.string().nullable().optional(),
  }),
});

export const bookingCodeParamSchema = z.object({
  params: z.object({ code: z.string().length(6) }),
});

export const bookingIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const bookingListQuerySchema = z.object({
  query: z.object({
    branchId: z.string().uuid().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    customerId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().optional() }),
});

export const upcomingBookingsQuerySchema = z.object({
  query: z.object({ branchId: z.string().uuid() }),
});

export type PublicAvailabilityBody = z.infer<typeof publicAvailabilitySchema>['body'];
export type CreateBookingBody = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingBody = z.infer<typeof updateBookingSchema>['body'];
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>['query'];
export type CancelBookingBody = z.infer<typeof cancelBookingSchema>['body'];
export type UpcomingBookingsQuery = z.infer<typeof upcomingBookingsQuerySchema>['query'];
