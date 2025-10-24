import { getDatabaseClient } from '../config/database';
import { env } from '../config/env';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  environment: string;
  database: 'connected' | 'disconnected';
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    await getDatabaseClient().$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'connected',
    };
  } catch (error) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'disconnected',
    };
  }
};
