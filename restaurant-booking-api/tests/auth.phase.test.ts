const mockFindByEmail = jest.fn();
const mockFindById = jest.fn();
const mockUpdateLastLogin = jest.fn();
const mockRecordLoginAttempt = jest.fn();
const mockComparePassword = jest.fn();
const mockSignToken = jest.fn();
const mockCreateSession = jest.fn();
const mockGetSession = jest.fn();
const mockRevokeSession = jest.fn();
const mockRevokeUserSessions = jest.fn();

jest.mock('../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findByEmail: mockFindByEmail,
    findById: mockFindById,
    updateLastLogin: mockUpdateLastLogin,
    setPassword: jest.fn(),
  })),
}));

jest.mock('../src/utils/password', () => ({
  comparePassword: mockComparePassword,
  hashPassword: jest.fn(),
}));

jest.mock('../src/utils/jwt', () => ({
  signToken: mockSignToken,
  verifyToken: jest.fn(),
}));

jest.mock('../src/services/audit.service', () => ({
  AuditService: {
    recordLoginAttempt: mockRecordLoginAttempt,
  },
}));

jest.mock('../src/services/session.service', () => ({
  SessionService: {
    createSession: mockCreateSession,
    getSession: mockGetSession,
    revokeSession: mockRevokeSession,
    revokeUserSessions: mockRevokeUserSessions,
  },
}));

jest.mock('../src/services/redis.service', () => ({
  RedisService: {
    getClient: () => ({
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      scanStream: jest.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {
          return;
        },
      }),
    }),
  },
}));

jest.mock('../src/services/database.service', () => ({
  DatabaseService: {
    getClient: jest.fn(() => ({
      notification: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    })),
  },
}));

jest.mock('../src/services/email.service', () => ({
  EmailService: {
    sendEmail: jest.fn(),
  },
}));

let AuthServiceClass: typeof import('../src/services/auth.service').AuthService;

describe('Phase 2 - Authentication', () => {
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
      ({ AuthService: AuthServiceClass } = await import('../src/services/auth.service'));
    } catch (error) {
      console.error('auth.phase.beforeAll failed', error);
      throw error;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('issues access and refresh tokens for valid credentials', async () => {
    expect(AuthServiceClass).toBeDefined();
    const service = new AuthServiceClass();
    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      passwordHash: 'salt:hash',
      isActive: true,
      role: 'MASTER_ADMIN' as const,
      branchId: null,
    };
    mockFindByEmail.mockResolvedValue(user);
    mockComparePassword.mockResolvedValue(true);
    mockUpdateLastLogin.mockResolvedValue(undefined);
    mockCreateSession.mockResolvedValue({ tokenId: 'session-1', userId: user.id, expiresAt: Date.now() + 1000 });
    mockSignToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const result = await service.login({ email: 'ADMIN@example.com', password: 'Passw0rd!' }, '1.1.1.1', 'Jest Test');

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: expect.any(Number),
      refreshTokenExpiresIn: expect.any(Number),
    });
    expect(mockUpdateLastLogin).toHaveBeenCalledWith(user.id);
    expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email, success: true, userId: user.id })
    );
  });

  it('rejects invalid passwords with an AppError', async () => {
    expect(AuthServiceClass).toBeDefined();
    const service = new AuthServiceClass();
    const user = {
      id: 'user-2',
      email: 'staff@example.com',
      passwordHash: 'salt:hash',
      isActive: true,
      role: 'STAFF' as const,
      branchId: 'branch-1',
    };
    mockFindByEmail.mockResolvedValue(user);
    mockComparePassword.mockResolvedValue(false);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }, '2.2.2.2', 'Jest Test')
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password' });

    expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email, success: false })
    );
  });
});
