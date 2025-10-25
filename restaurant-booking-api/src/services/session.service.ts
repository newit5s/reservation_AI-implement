import { randomUUID } from 'crypto';
import ms from 'ms';
import { env } from '../config/env';
import { REFRESH_TOKEN_PREFIX } from '../utils/constants';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';

export interface RefreshSession {
  userId: string;
  tokenId: string;
  expiresAt: number;
}

class SessionService {
  private static fallbackStore = new Map<string, RefreshSession>();

  private static getKey(tokenId: string): string {
    return `${REFRESH_TOKEN_PREFIX}:${tokenId}`;
  }

  static async createSession(userId: string): Promise<RefreshSession> {
    const tokenId = randomUUID();
    const ttlMs = ms(env.REFRESH_TOKEN_EXPIRE);
    const expiresAt = Date.now() + ttlMs;
    const client = RedisService.getClient();

    const session: RefreshSession = { userId, tokenId, expiresAt };
    try {
      await client.set(SessionService.getKey(tokenId), JSON.stringify(session), 'PX', ttlMs);
    } catch (error) {
      logger.warn('Falling back to in-memory session store', { error });
      SessionService.fallbackStore.set(SessionService.getKey(tokenId), session);
    }

    return session;
  }

  static async getSession(tokenId: string): Promise<RefreshSession | null> {
    try {
      const data = await RedisService.getClient().get(SessionService.getKey(tokenId));
      if (data) {
        return JSON.parse(data) as RefreshSession;
      }
    } catch (error) {
      logger.warn('Redis unavailable when fetching session, using fallback', { error });
    }
    const fallbackKey = SessionService.getKey(tokenId);
    const fallback = SessionService.fallbackStore.get(fallbackKey);
    if (fallback) {
      if (fallback.expiresAt > Date.now()) {
        return fallback;
      }
      SessionService.fallbackStore.delete(fallbackKey);
    }
    return null;
  }

  static async revokeSession(tokenId: string): Promise<void> {
    try {
      await RedisService.getClient().del(SessionService.getKey(tokenId));
    } catch (error) {
      logger.warn('Redis unavailable when revoking session, using fallback', { error });
    }
    SessionService.fallbackStore.delete(SessionService.getKey(tokenId));
  }

  static async revokeUserSessions(userId: string): Promise<void> {
    const client = RedisService.getClient();
    const pattern = `${REFRESH_TOKEN_PREFIX}:*`;
    try {
      const stream = client.scanStream({ match: pattern });

      for await (const keys of stream) {
        if (Array.isArray(keys)) {
          await Promise.all(
            keys.map(async (key) => {
              const value = await client.get(key);
              if (value) {
                const session = JSON.parse(value) as RefreshSession;
                if (session.userId === userId) {
                  await client.del(key);
                }
              }
            })
          );
        }
      }
    } catch (error) {
      logger.warn('Redis unavailable when revoking user sessions, using fallback', { error });
      for (const [key, session] of SessionService.fallbackStore.entries()) {
        if (session.userId === userId) {
          SessionService.fallbackStore.delete(key);
        }
      }
    }
  }
}

export { SessionService };
