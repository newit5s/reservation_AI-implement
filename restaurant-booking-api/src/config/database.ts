import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

let prisma: PrismaClient | null = null;

export const getDatabaseClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL
        }
      }
    });

    prisma
      .$connect()
      .then(() => logger.info('Database connection established'))
      .catch((error) => {
        logger.error('Database connection failed', { error });
      });
  }

  return prisma;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
