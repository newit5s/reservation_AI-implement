import http from 'http';
import express from 'express';
import request from 'supertest';

const connectMock = jest.fn();
const disconnectMock = jest.fn();
const queryMock = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: connectMock,
    $disconnect: disconnectMock,
    $queryRaw: queryMock
  }))
}));

const flushPromises = async () => new Promise<void>((resolve) => setImmediate(resolve));

let env: typeof import('../src/config/env').env;
let createApp: typeof import('../src/config/app').createApp;
let getDatabaseClient: typeof import('../src/config/database').getDatabaseClient;
let disconnectDatabase: typeof import('../src/config/database').disconnectDatabase;
let getHealthStatus: typeof import('../src/services/health.service').getHealthStatus;
let errorHandler: typeof import('../src/middleware/error.middleware').errorHandler;
let AppErrorClass: typeof import('../src/utils/app-error').AppError;
let logger: typeof import('../src/utils/logger').logger;
let RATE_LIMIT_MAX_REQUESTS: number;
let RATE_LIMIT_WINDOW_MS: number;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5000';
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/restaurant_booking';
  process.env.JWT_SECRET = 'test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.FRONTEND_URL = 'http://localhost:5173';

  ({ env } = await import('../src/config/env'));
  ({ createApp } = await import('../src/config/app'));
  ({ getDatabaseClient, disconnectDatabase } = await import('../src/config/database'));
  ({ getHealthStatus } = await import('../src/services/health.service'));
  ({ errorHandler } = await import('../src/middleware/error.middleware'));
  ({ AppError: AppErrorClass } = await import('../src/utils/app-error'));
  ({ logger } = await import('../src/utils/logger'));
  ({ RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } = await import('../src/utils/constants'));
});

beforeEach(async () => {
  jest.clearAllMocks();
  connectMock.mockResolvedValue(undefined);
  disconnectMock.mockResolvedValue(undefined);
  queryMock.mockResolvedValue([{ ok: 1 }]);
  if (typeof disconnectDatabase === 'function') {
    await disconnectDatabase();
  }
});

afterAll(async () => {
  if (typeof disconnectDatabase === 'function') {
    await disconnectDatabase();
  }
});

describe('Backend setup validation', () => {
  it('loads environment configuration', () => {
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('test');
    expect(env.FRONTEND_URL).toBe('http://localhost:5173');
  });

  it('starts the HTTP server without unhandled errors', async () => {
    const app = createApp();
    const server = http.createServer(app);

    await expect(
      new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, () => resolve());
      })
    ).resolves.toBeUndefined();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('attaches CORS and rate limit headers according to configuration', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(process.env.FRONTEND_URL);
    expect(response.headers['ratelimit-limit']).toBe(String(RATE_LIMIT_MAX_REQUESTS));
    expect(response.headers['ratelimit-policy']).toContain(`${RATE_LIMIT_WINDOW_MS / 1000}`);
  });

  it('reports database connectivity status from the health service', async () => {
    const status = await getHealthStatus();

    expect(queryMock).toHaveBeenCalled();
    expect(status.database).toBe('connected');
  });

  it('marks the database as disconnected when queries fail', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection failed'));

    const status = await getHealthStatus();

    expect(status.database).toBe('disconnected');
  });

  it('returns formatted responses from the error middleware for AppError instances', async () => {
    const app = express();
    app.get('/error', () => {
      throw new AppErrorClass('Not Found', 404, { resource: 'test' });
    });
    app.use(errorHandler);

    const response = await request(app).get('/error');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Not Found',
      details: { resource: 'test' }
    });
  });

  it('logs unexpected errors via the error middleware', async () => {
    const errorSpy = jest.spyOn(logger, 'error');
    const app = express();
    app.get('/error', () => {
      throw new Error('Unhandled failure');
    });
    app.use(errorHandler);

    const response = await request(app).get('/error');

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith('Unhandled failure', expect.objectContaining({ stack: expect.any(String) }));
    errorSpy.mockRestore();
  });

  it('logs database connection success', async () => {
    const infoSpy = jest.spyOn(logger, 'info');

    getDatabaseClient();
    await flushPromises();

    expect(connectMock).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith('Database connection established');
    infoSpy.mockRestore();
  });

  it('logs database connection failures with metadata', async () => {
    const errorSpy = jest.spyOn(logger, 'error');
    connectMock.mockRejectedValueOnce(new Error('Cannot connect'));

    getDatabaseClient();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Database connection failed', expect.objectContaining({ error: expect.any(Error) }));
    errorSpy.mockRestore();
  });
});
