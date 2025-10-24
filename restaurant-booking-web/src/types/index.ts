export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'MASTER_ADMIN' | 'BRANCH_ADMIN' | 'STAFF';
  branchId?: string;
  token?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  branchId: string;
  tableId?: string;
  customerId?: string;
  bookingDate: string;
  timeSlot: string;
  partySize: number;
  status: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
