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

export interface BranchSummary {
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

export type PhaseStatus = 'complete' | 'in_progress' | 'pending';

export interface ProjectPhase {
  id: number;
  title: string;
  status: PhaseStatus;
  description: string;
  highlights: string[];
}
