import dotenv from 'dotenv';
import { z } from 'zod';
import { Environment } from '../types';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRE: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRE: z.string().default('30d'),
  REDIS_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = (): boolean => parsed.data.NODE_ENV === ('production' as Environment);
