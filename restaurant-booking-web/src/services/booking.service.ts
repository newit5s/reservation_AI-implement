import { apiClient } from './api';
import { ApiResponse, Booking } from '../types';
import { BookingFormValues } from '../utils/validators';

export const bookingService = {
  async list(): Promise<Booking[]> {
    const { data } = await apiClient.get<ApiResponse<Booking[]>>('bookings');
    return data.data;
  },
  async create(payload: BookingFormValues): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>('bookings', payload);
    return data.data;
  },
  async getUpcoming(): Promise<Booking[]> {
    const { data } = await apiClient.get<ApiResponse<Booking[]>>('bookings/upcoming');
    return data.data;
  }
};
