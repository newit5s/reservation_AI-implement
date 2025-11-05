import { BookingStatus } from '@prisma/client';

const mockDatabaseClient = {
  booking: {
    findMany: jest.fn(),
  },
  table: {
    aggregate: jest.fn(),
  },
};

jest.mock('../src/services/database.service', () => ({
  DatabaseService: {
    getClient: jest.fn(() => mockDatabaseClient),
  },
}));

describe('AnalyticsService', () => {
  let AnalyticsServiceClass: typeof import('../src/services/analytics.service').AnalyticsService;
  let analyticsService: import('../src/services/analytics.service').AnalyticsService;

  beforeAll(async () => {
    ({ AnalyticsService: AnalyticsServiceClass } = await import('../src/services/analytics.service'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsServiceClass();
  });

  it('summarises branch metrics for the current day', async () => {
    const referenceDate = new Date('2024-05-20T12:00:00Z');
    mockDatabaseClient.booking.findMany.mockResolvedValue([
      {
        status: BookingStatus.CONFIRMED,
        partySize: 4,
        bookingDate: new Date('2024-05-20T00:00:00Z'),
        timeSlot: new Date('1970-01-01T18:00:00Z'),
      },
      {
        status: BookingStatus.CHECKED_IN,
        partySize: 2,
        bookingDate: new Date('2024-05-20T00:00:00Z'),
        timeSlot: new Date('1970-01-01T19:00:00Z'),
      },
      {
        status: BookingStatus.CANCELLED,
        partySize: 2,
        bookingDate: new Date('2024-05-20T00:00:00Z'),
        timeSlot: new Date('1970-01-01T20:00:00Z'),
      },
      {
        status: BookingStatus.NO_SHOW,
        partySize: 3,
        bookingDate: new Date('2024-05-20T00:00:00Z'),
        timeSlot: new Date('1970-01-01T18:30:00Z'),
      },
    ]);
    mockDatabaseClient.table.aggregate.mockResolvedValue({ _sum: { capacity: 20 } });

    const summary = await analyticsService.getBranchSummary('branch-1', referenceDate);

    expect(summary.totalBookings).toBe(4);
    expect(summary.completedBookings).toBe(0);
    expect(summary.cancelledBookings).toBe(1);
    expect(summary.upcomingArrivals).toBe(1);
    expect(summary.checkedInGuests).toBe(2);
    expect(summary.totalCapacity).toBe(20);
    expect(summary.occupancyRate).toBeCloseTo(0.1);
    expect(summary.noShowRate).toBeCloseTo(0.25);
  });

  it('builds booking trends for the requested range', async () => {
    const referenceDate = new Date('2024-05-10T12:00:00Z');
    mockDatabaseClient.booking.findMany.mockResolvedValue([
      { bookingDate: new Date('2024-05-08T00:00:00Z'), status: BookingStatus.COMPLETED },
      { bookingDate: new Date('2024-05-08T00:00:00Z'), status: BookingStatus.CANCELLED },
      { bookingDate: new Date('2024-05-09T00:00:00Z'), status: BookingStatus.NO_SHOW },
    ]);

    const trend = await analyticsService.getBranchTrends('branch-1', 3, referenceDate);

    expect(trend).toHaveLength(3);
    expect(trend[0]).toEqual({
      date: '2024-05-08',
      totalBookings: 2,
      completed: 1,
      cancelled: 1,
      noShow: 0,
    });
    expect(trend[1]).toEqual({
      date: '2024-05-09',
      totalBookings: 1,
      completed: 0,
      cancelled: 0,
      noShow: 1,
    });
  });
});
