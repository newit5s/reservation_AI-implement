import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: process.env.DATABASE_URL || (isTest ? 'postgresql://localhost/testdb' : undefined),
    REDIS_URL: process.env.REDIS_URL || (isTest ? 'redis://localhost:6379' : undefined),
    JWT_SECRET: process.env.JWT_SECRET || (isTest ? 'test_jwt_secret' : undefined),
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '30d',
    FRONTEND_URL: process.env.FRONTEND_URL || (isTest ? 'http://localhost:5173' : undefined),
    // ...other env vars...
};

// Basic validation: in CI/dev fail loudly, in test provide defaults to allow unit tests to run
const missing = Object.entries(env)
  .filter(([, v]) => v === undefined)
  .map(([k]) => k);

if (missing.length && !isTest) {
  // keep existing behavior in non-test
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration, missing:', missing.join(', '));
  process.exit(1);
}

export default env;
