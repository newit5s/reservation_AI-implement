import { NotificationRecipient, NotificationStatus, NotificationType } from '@prisma/client';

const redisStore = new Map<string, string>();

type MockDatabaseClient = {
  notification: {
    create: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  customer: {
    findUnique: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

const createMockDatabaseClient = (): MockDatabaseClient => ({
  notification: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
});

const databaseClientHolder: { current: MockDatabaseClient | null } = { current: null };

jest.mock('../src/services/database.service', () => ({
  DatabaseService: {
    getClient: jest.fn(() => databaseClientHolder.current),
  },
}));

jest.mock('../src/services/email.service', () => ({
  EmailService: {
    sendEmail: jest.fn(async () => undefined),
  },
}));

const emitNotification = jest.fn();

jest.mock('../src/services/realtime.service', () => ({
  realtimeService: {
    emitNotification: (...args: unknown[]) => emitNotification(...args),
  },
}));

const mockRedisClient = {
  get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
  set: jest.fn(async (key: string, value: string) => {
    redisStore.set(key, value);
  }),
  del: jest.fn(),
  scanStream: jest.fn(),
};

jest.mock('../src/services/redis.service', () => ({
  RedisService: {
    getClient: jest.fn(() => mockRedisClient),
  },
}));

databaseClientHolder.current = createMockDatabaseClient();
const mockDatabaseClient = databaseClientHolder.current as MockDatabaseClient;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { notificationService } = require('../src/services/notification.service');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    (Object.values(mockDatabaseClient.notification) as jest.Mock[]).forEach((mock) => mock.mockReset());
    (Object.values(mockDatabaseClient.customer) as jest.Mock[]).forEach((mock) => mock.mockReset());
    (Object.values(mockDatabaseClient.user) as jest.Mock[]).forEach((mock) => mock.mockReset());
  });

  const flushQueue = async () => new Promise((resolve) => setImmediate(resolve));

  it('delivers email notifications when contact exists', async () => {
    mockDatabaseClient.notification.create.mockResolvedValue({ id: 'notif-1' });
    mockDatabaseClient.notification.update.mockResolvedValue({ id: 'notif-1', status: NotificationStatus.SENT });
    mockDatabaseClient.customer.findUnique.mockResolvedValue({ email: 'guest@example.com', phone: null });

    await notificationService.enqueue({
      branchId: 'branch-1',
      recipientType: NotificationRecipient.CUSTOMER,
      recipientId: 'cust-1',
      subject: 'Test',
      content: '<p>Hello</p>',
      channels: [NotificationType.EMAIL],
    });
    await flushQueue();

    expect(mockDatabaseClient.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notif-1' },
        data: expect.objectContaining({ status: NotificationStatus.SENT }),
      })
    );
    expect(emitNotification).toHaveBeenCalled();
  });

  it('falls back to in-memory delivery when prisma delegate is unavailable', async () => {
    const originalNotification = { ...mockDatabaseClient.notification };
    mockDatabaseClient.notification.create = undefined as unknown as jest.Mock;
    mockDatabaseClient.notification.update = undefined as unknown as jest.Mock;
    mockDatabaseClient.notification.findMany = undefined as unknown as jest.Mock;

    const branchId = 'branch-2';
    try {
      await notificationService.enqueue({
        branchId,
        recipientType: NotificationRecipient.USER,
        recipientId: 'user-42',
        subject: 'Realtime fallback',
        content: 'This should still emit',
        channels: [NotificationType.IN_APP],
      });
      await flushQueue();
    } finally {
      mockDatabaseClient.notification.create = originalNotification.create;
      mockDatabaseClient.notification.update = originalNotification.update;
      mockDatabaseClient.notification.findMany = originalNotification.findMany;
    }

    expect(emitNotification).toHaveBeenCalledWith(
      branchId,
      NotificationRecipient.USER,
      'user-42',
      expect.objectContaining({
        type: NotificationType.IN_APP,
        status: NotificationStatus.SENT,
      })
    );
  });

  it('persists notification preferences in redis', async () => {
    const updated = await notificationService.updatePreferences(
      NotificationRecipient.USER,
      'user-1',
      { sms: true, locale: 'vi' }
    );
    expect(updated.sms).toBe(true);
    expect(updated.locale).toBe('vi');

    const fetched = await notificationService.getPreferences(NotificationRecipient.USER, 'user-1');
    expect(fetched.sms).toBe(true);
  });

  it('lists notifications for recipient', async () => {
    mockDatabaseClient.notification.findMany.mockResolvedValue([{ id: 'notif-2' }]);
    const records = await notificationService.list(NotificationRecipient.USER, 'user-1');
    expect(records).toHaveLength(1);
    expect(mockDatabaseClient.notification.findMany).toHaveBeenCalled();
  });
});
