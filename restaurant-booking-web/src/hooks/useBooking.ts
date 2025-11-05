import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { Booking } from '../types';

export const useBookings = () => {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.list()
  });

  const createBooking = useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  return {
    bookingsQuery,
    createBooking
  };
};

export const useUpcomingBookings = (branchId: string) => {
  return useQuery<Booking[]>({
    queryKey: ['bookings', 'upcoming', branchId],
    queryFn: () => bookingService.getUpcoming(branchId),
    enabled: Boolean(branchId)
  });
};
