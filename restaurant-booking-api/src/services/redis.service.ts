import { EventEmitter } from 'events';
import { env } from '../config/env';
import { logger } from '../utils/logger';

type ScanStreamOptions = {
  match?: string;
};

type RedisLike = {
  set(key: string, value: string, mode?: 'PX' | 'EX', ttl?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  scanStream(options: ScanStreamOptions): AsyncIterable<string[]>;
};

class InMemoryRedis extends EventEmitter implements RedisLike {
  private store = new Map<string, { value: string; expireAt?: number }>();

  private cleanupExpired(key: string): void {
    const entry = this.store.get(key);
    if (entry && entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
    }
  }

  async set(key: string, value: string, mode?: 'PX' | 'EX', ttl?: number): Promise<void> {
    let expireAt: number | undefined;
    if (mode && ttl) {
      const ttlMs = mode === 'EX' ? ttl * 1000 : ttl;
      expireAt = Date.now() + ttlMs;
    }
    this.store.set(key, { value, expireAt });
  }

  async get(key: string): Promise<string | null> {
    this.cleanupExpired(key);
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async *scanStream(options: ScanStreamOptions): AsyncIterable<string[]> {
    const regex = options.match ? new RegExp(`^${options.match.replace(/\*/g, '.*')}$`) : null;
    const keys = Array.from(this.store.keys()).filter((key) => {
      this.cleanupExpired(key);
      return regex ? regex.test(key) : true;
    });
    if (keys.length) {
      yield keys;
    }
  }
}

let client: RedisLike | null = null;

export class RedisService {
  static getClient(): RedisLike {
    if (!client) {
      try {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const Redis = require('ioredis');
        const redisClient = new Redis(env.REDIS_URL, {
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        redisClient
          .connect()
          .then(() => logger.info('Redis connected'))
          .catch((error: Error) => {
            logger.error('Redis connection failed, using in-memory fallback', { error });
          });
        redisClient.on('error', (error: Error) => {
          logger.error('Redis connection error', { error });
        });
        client = redisClient as RedisLike;
      } catch (error) {
        logger.warn('ioredis not available, using in-memory fallback');
        client = new InMemoryRedis();
      }
    }
    return client as RedisLike;
  }
}

export { RedisLike };
