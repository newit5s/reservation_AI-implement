import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  bookingCodeParamSchema,
  bookingIdParamSchema,
  bookingListQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  publicAvailabilitySchema,
  upcomingBookingsQuerySchema,
  updateBookingSchema,
} from '../validations/booking.validation';
import { controller } from './utils';

const router = Router();

router.post('/bookings/check-availability', validateRequest(publicAvailabilitySchema), BookingController.publicAvailability);
router.get('/bookings/:code', validateRequest(bookingCodeParamSchema), BookingController.getByCode);

router.use(authenticate);

router.get('/bookings', validateRequest(bookingListQuerySchema), controller(BookingController.list));
router.post('/bookings', validateRequest(createBookingSchema), controller(BookingController.create));
router.put('/bookings/:id', validateRequest(updateBookingSchema), controller(BookingController.update));
router.post(
  '/bookings/:id/confirm',
  validateRequest(bookingIdParamSchema),
  controller(BookingController.confirm)
);
router.post('/bookings/:id/cancel', validateRequest(cancelBookingSchema), controller(BookingController.cancel));
router.post('/bookings/:id/no-show', validateRequest(bookingIdParamSchema), controller(BookingController.noShow));
router.post('/bookings/:id/checkin', validateRequest(bookingIdParamSchema), controller(BookingController.checkIn));
router.get(
  '/bookings/upcoming',
  validateRequest(upcomingBookingsQuerySchema),
  controller(BookingController.upcoming)
);

export { router as bookingRoutes };
