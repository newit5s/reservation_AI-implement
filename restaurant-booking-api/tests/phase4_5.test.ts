import { BookingStatus, CustomerTier, NotificationRecipient, NotificationStatus, NotificationType } from '@prisma/client';

const mockAssertPermission = jest.fn();

jest.mock('../src/services/permission.service', () => ({
  PermissionService: {
    assertPermission: mockAssertPermission,
    getAccessibleBranches: jest.fn(() => null),
  },
}));

jest.mock('../src/repositories/booking.repository', () => {
  const mockInstance = {
    findById: jest.fn(),
    getUpcoming: jest.fn(),
  };
  return {
    BookingRepository: jest.fn(() => mockInstance),
    __esModule: true,
    mockInstance,
  };
});

const { mockInstance: mockBookingRepositoryInstance } = jest.requireMock('../src/repositories/booking.repository');

jest.mock('../src/repositories/table.repository', () => {
  const mockInstance = {
    findById: jest.fn(),
  };
  return {
    TableRepository: jest.fn(() => mockInstance),
    __esModule: true,
    mockInstance,
  };
});

const { mockInstance: mockTableRepositoryInstance } = jest.requireMock('../src/repositories/table.repository');

jest.mock('../src/repositories/customer.repository', () => {
  const mockCustomerRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  return {
    customerRepository: mockCustomerRepository,
    __esModule: true,
  };
});

const { customerRepository: mockCustomerRepository } = jest.requireMock('../src/repositories/customer.repository');

const buildNotificationRecord = (overrides?: Partial<{ id: string; recipientType: NotificationRecipient; recipientId: string | null; type: NotificationType; subject: string | null; content: string; status: NotificationStatus; sentAt: Date | null; readAt: Date | null; errorMessage: string | null; createdAt: Date }>) => ({
  id: overrides?.id ?? `notification-${Math.random().toString(16).slice(2)}`,
  recipientType: overrides?.recipientType ?? NotificationRecipient.USER,
  recipientId: overrides?.recipientId ?? null,
  type: overrides?.type ?? NotificationType.IN_APP,
  subject: overrides?.subject ?? null,
  content: overrides?.content ?? '',
  status: overrides?.status ?? NotificationStatus.PENDING,
  sentAt: overrides?.sentAt ?? null,
  readAt: overrides?.readAt ?? null,
  errorMessage: overrides?.errorMessage ?? null,
  createdAt: overrides?.createdAt ?? new Date(),
});

const mockDatabaseClient = {
  booking: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  bookingHistory: {
    create: jest.fn(),
  },
  customer: {
    create: jest.fn(),
    findUnique: jest.fn().mockResolvedValue({ email: 'guest@example.com', phone: null }),
    update: jest.fn(),
  },
  customerNote: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  customerTimeline: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  waitlistEntry: {
    updateMany: jest.fn(),
  },
  table: {
    count: jest.fn(),
  },
  loyaltyAccount: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loyaltyTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  reward: {
    findMany: jest.fn(),
  },
  rewardRedemption: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn().mockImplementation(async ({ data }) =>
      buildNotificationRecord({
        recipientType: data.recipientType,
        recipientId: data.recipientId ?? null,
        type: data.type,
        subject: data.subject ?? null,
        content: data.content,
      })
    ),
    update: jest.fn().mockImplementation(async ({ where, data }) =>
      buildNotificationRecord({
        id: where.id,
        status: data.status ?? NotificationStatus.PENDING,
        sentAt: data.sentAt ?? null,
        errorMessage: data.errorMessage ?? null,
      })
    ),
    findMany: jest.fn().mockResolvedValue([]),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue({ email: 'admin@example.com', phone: null }),
  },
  $transaction: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../src/services/database.service', () => ({
  DatabaseService: {
    getClient: jest.fn(() => mockDatabaseClient),
  },
}));

jest.mock('../src/models', () => {
  const mockBranchModel = {
    isOpen: jest.fn(),
    getAvailableTables: jest.fn(),
  };
  const mockBookingModel = {
    checkAvailability: jest.fn(),
    generateBookingCode: jest.fn(),
  };
  const mockCustomerModel = {
    calculateTier: jest.fn(),
    checkBlacklist: jest.fn(),
    recordTimeline: jest.fn(),
    updateStats: jest.fn(),
  };
  return {
    BranchModel: mockBranchModel,
    BookingModel: mockBookingModel,
    CustomerModel: mockCustomerModel,
    __esModule: true,
  };
});

const {
  BranchModel: mockBranchModel,
  BookingModel: mockBookingModel,
  CustomerModel: mockCustomerModel,
} = jest.requireMock('../src/models');

jest.mock('../src/services/booking-automation.service', () => {
  const mockAutomation = {
    shouldAutoConfirm: jest.fn(),
    suggestAlternativeSlots: jest.fn(),
    addToWaitlist: jest.fn(),
    scheduleNotifications: jest.fn(),
    trackCustomerActivity: jest.fn(),
    promoteWaitlist: jest.fn(),
  };
  return {
    BookingAutomationService: mockAutomation,
    __esModule: true,
  };
});

const { BookingAutomationService: mockAutomation } = jest.requireMock(
  '../src/services/booking-automation.service'
);

const mockEmail = { sendEmail: jest.fn() };

jest.mock('../src/services/email.service', () => ({
  EmailService: mockEmail,
}));

const mockLoyalty = {
  ensureAccount: jest.fn(),
  adjustTier: jest.fn(),
  awardPoints: jest.fn(),
  adjustPoints: jest.fn(),
  getStatus: jest.fn(),
  getHistory: jest.fn(),
  getRewards: jest.fn(),
  redeemReward: jest.fn(),
};


jest.mock('../src/services/loyalty.service', () => ({
  LoyaltyService: mockLoyalty,
}));

let BookingServiceClass: typeof import('../src/services/booking.service').BookingService;
let CustomerServiceClass: typeof import('../src/services/customer.service').CustomerService;

beforeAll(async () => {
  try {
    ({ BookingService: BookingServiceClass } = await import('../src/services/booking.service'));
    ({ CustomerService: CustomerServiceClass } = await import('../src/services/customer.service'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('phase4_5.beforeAll failed', error);
    throw error;
  }
});

describe('Phase 4 & 5 services', () => {
  const user = { id: 'user-1', email: 'user@example.com', role: 'MASTER_ADMIN', branchId: null } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingRepositoryInstance.findById.mockResolvedValue(null);
    mockBookingRepositoryInstance.getUpcoming.mockResolvedValue([]);
    mockTableRepositoryInstance.findById.mockResolvedValue({
      id: 'table-1',
      branchId: 'branch-1',
      tableNumber: 'T1',
      capacity: 4,
      minCapacity: 2,
      tableType: 'REGULAR',
      positionX: null,
      positionY: null,
      floor: 1,
      isActive: true,
      isCombinable: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
    mockBranchModel.isOpen.mockResolvedValue(true);
    mockBranchModel.getAvailableTables.mockResolvedValue([{ id: 'table-1' }]);
    mockBookingModel.generateBookingCode.mockResolvedValue('ABC123');
    mockDatabaseClient.table.count.mockResolvedValue(5);
    mockCustomerRepository.findById.mockResolvedValue({
      id: 'cust-1',
      fullName: 'VIP Customer',
      email: 'vip@example.com',
      phone: '123456',
      notes: null,
      preferences: {},
    });
    mockCustomerModel.checkBlacklist.mockResolvedValue(false);
    mockCustomerModel.calculateTier.mockResolvedValue(CustomerTier.VIP);
    mockAutomation.shouldAutoConfirm.mockResolvedValue(true);
    mockAutomation.suggestAlternativeSlots.mockResolvedValue([]);
    mockAutomation.addToWaitlist.mockResolvedValue(undefined);
    mockAutomation.scheduleNotifications.mockReturnValue(undefined);
    mockBookingModel.checkAvailability.mockResolvedValue(true);
    mockLoyalty.ensureAccount.mockResolvedValue(undefined);
    mockLoyalty.adjustTier.mockResolvedValue(undefined);
    mockLoyalty.awardPoints.mockResolvedValue(undefined);
    mockLoyalty.getRewards.mockResolvedValue([]);
    mockDatabaseClient.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      bookingCode: 'ABC123',
      branch: { id: 'branch-1', name: 'Branch' },
      table: { id: 'table-1', tableNumber: 'T1' },
      customer: { id: 'cust-1', email: 'vip@example.com', fullName: 'VIP Customer' },
      bookingDate: new Date('2024-05-20'),
      timeSlot: new Date('1970-01-01T18:00:00Z'),
    });
    mockDatabaseClient.booking.create.mockResolvedValue({
      id: 'booking-1',
      bookingCode: 'ABC123',
      branchId: 'branch-1',
      bookingDate: new Date('2024-05-20'),
      timeSlot: new Date('1970-01-01T18:00:00Z'),
      durationMinutes: 120,
      partySize: 4,
      tableId: 'table-1',
      customerId: 'cust-1',
      status: BookingStatus.PENDING,
      specialRequests: null,
      internalNotes: null,
      source: 'ADMIN',
      createdById: user.id,
      confirmedAt: null,
      checkedInAt: null,
      cancelledAt: null,
      cancellationReason: null,
      customer: { id: 'cust-1', email: 'vip@example.com', fullName: 'VIP Customer' },
    });
    mockDatabaseClient.booking.update.mockResolvedValue({
      id: 'booking-1',
      bookingCode: 'ABC123',
      branchId: 'branch-1',
      bookingDate: new Date('2024-05-20'),
      timeSlot: new Date('1970-01-01T18:00:00Z'),
      durationMinutes: 120,
      partySize: 4,
      tableId: 'table-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      specialRequests: null,
      internalNotes: null,
      source: 'ADMIN',
      createdById: user.id,
      confirmedAt: new Date(),
      checkedInAt: null,
      cancelledAt: null,
      cancellationReason: null,
      customer: { id: 'cust-1', email: 'vip@example.com', fullName: 'VIP Customer' },
    });
    mockDatabaseClient.bookingHistory.create.mockResolvedValue({});
  });

  it('auto-confirms VIP bookings and schedules notifications', async () => {
    const service = new BookingServiceClass();
    const result = await service.createBooking(user, {
      branchId: 'branch-1',
      bookingDate: '2024-05-20',
      timeSlot: '18:00',
      partySize: 4,
      customerId: 'cust-1',
    });

    expect(result.status).toBe('booked');
    expect(mockAutomation.shouldAutoConfirm).toHaveBeenCalled();
    expect(mockAutomation.scheduleNotifications).toHaveBeenCalled();
    expect(mockEmail.sendEmail).toHaveBeenCalled();
  });

  it('adds customers to waitlist when slot unavailable', async () => {
    mockBookingModel.checkAvailability.mockResolvedValue(false);
    mockAutomation.suggestAlternativeSlots.mockResolvedValue([
      { bookingDate: '2024-05-21', time: '18:30' },
    ]);
    mockAutomation.shouldAutoConfirm.mockResolvedValue(false);

    const service = new BookingServiceClass();
    const result = await service.createBooking(user, {
      branchId: 'branch-1',
      bookingDate: '2024-05-20',
      timeSlot: '18:00',
      partySize: 4,
      customerId: 'cust-1',
      autoWaitlist: true,
    });

    expect(result.status).toBe('waitlisted');
    if (result.status !== 'waitlisted') {
      throw new Error('Expected waitlisted result');
    }
    expect(mockAutomation.addToWaitlist).toHaveBeenCalled();
    expect(result.suggestions).toHaveLength(1);
  });

  it('blacklists customer and records timeline', async () => {
    const service = new CustomerServiceClass();
    mockDatabaseClient.customer.update.mockResolvedValue({
      id: 'cust-1',
      fullName: 'Customer',
      isBlacklisted: true,
      blacklistReason: 'Fraud',
    });

    await service.blacklist(user, 'cust-1', 'Fraud');

    expect(mockDatabaseClient.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { isBlacklisted: true, blacklistReason: 'Fraud' },
    });
    const [, event, description] = mockCustomerModel.recordTimeline.mock.calls[0];
    expect(event).toBe('BLACKLISTED');
    expect(description).toContain('blacklisted');
  });
});
