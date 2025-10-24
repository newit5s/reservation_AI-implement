import { z } from 'zod';

export const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  partySize: z.number().min(1).max(20),
  specialRequests: z.string().optional()
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
