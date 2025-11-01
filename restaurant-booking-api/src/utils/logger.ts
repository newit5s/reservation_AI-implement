import { createLogger, format, transports } from 'winston';
import { APP_NAME } from './constants';

const { combine, timestamp, printf, colorize } = format;

const serializeMeta = (input: unknown): unknown => {
  if (input instanceof Error) {
    const base: Record<string, unknown> = {
      name: input.name,
      message: input.message,
      stack: input.stack,
    };

    const original = input as unknown as Record<string, unknown>;
    for (const key of Object.getOwnPropertyNames(input)) {
      if (!['name', 'message', 'stack'].includes(key)) {
        base[key] = original[key];
      }
    }

    return base;
  }

  if (Array.isArray(input)) {
    return input.map((value) => serializeMeta(value));
  }

  if (input && typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[key] = serializeMeta(value);
      return acc;
    }, {});
  }

  return input;
};

const logFormat = printf(({ level, message, timestamp: time, ...meta }) => {
  const serializedMeta = serializeMeta(meta) as Record<string, unknown>;
  const metaString = Object.keys(serializedMeta).length ? ` ${JSON.stringify(serializedMeta)}` : '';
  return `${time} [${APP_NAME}] ${level}: ${message}${metaString}`;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ],
});
