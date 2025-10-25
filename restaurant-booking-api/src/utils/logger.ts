import { createLogger, format, transports } from 'winston';
import { APP_NAME } from './constants';

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp: time, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
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
