import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: PrismaClient;

  static getClient(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
      });
      DatabaseService.instance.$connect().catch((error) => {
        logger.error('Failed to connect to database', { error });
      });
    }
    return DatabaseService.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
    }
  }
}

export { DatabaseService };
