import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/restaurant_booking';
process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

const queryMock = jest.fn().mockResolvedValue(1);

jest.mock('../src/config/database', () => ({
  getDatabaseClient: () => ({
    $queryRaw: queryMock
  })
}));

describe('Backend setup validation', () => {
  it('loads environment configuration', async () => {
    const { env } = await import('../src/config/env');
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('initialises express application with middleware and routes', async () => {
    const { createApp } = await import('../src/config/app');
    const app = createApp();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers['access-control-allow-origin']).toBe(process.env.FRONTEND_URL);
  });

  it('configures rate limiting headers', async () => {
    const { createApp } = await import('../src/config/app');
    const app = createApp();
    const response = await request(app).get('/api/health');
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
  });
});
