const mockAssertPermission = jest.fn();

jest.mock('../src/services/permission.service', () => ({
  PermissionService: {
    assertPermission: mockAssertPermission,
    getAccessibleBranches: jest.fn(),
  },
}));

jest.mock('../src/repositories/table.repository', () => ({
  TableRepository: jest.fn().mockImplementation(() => ({
    findByBranch: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  })),
}));

jest.mock('../src/services/tableEvents.service', () => ({
  TableEvents: {
    tableUpdated: jest.fn(),
    tableRemoved: jest.fn(),
    layoutUpdated: jest.fn(),
  },
}));

jest.mock('../src/services/database.service', () => ({
  DatabaseService: {
    getClient: jest.fn().mockReturnValue({
      table: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    }),
  },
}));

let TableServiceClass: typeof import('../src/services/table.service').TableService;

describe('Phase 3 - Core table APIs', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5000';
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/restaurant_booking';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '15m';
    process.env.REFRESH_TOKEN_EXPIRE = '30d';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    try {
      ({ TableService: TableServiceClass } = await import('../src/services/table.service'));
    } catch (error) {
      console.error('core.phase.beforeAll failed', error);
      throw error;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns available tables for a branch request', async () => {
    const service = new TableServiceClass();
    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'MASTER_ADMIN' as const,
      branchId: null,
    };
    const request = {
      branchId: 'branch-1',
      date: new Date('2024-05-20'),
      time: new Date('1970-01-01T18:00:00Z'),
      partySize: 4,
    };

    await expect(service.checkAvailability(user, request)).resolves.toEqual([]);
  });
});
