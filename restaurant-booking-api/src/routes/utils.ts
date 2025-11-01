import type { RequestHandler } from 'express';

export const controller = (handler: (...args: any[]) => Promise<unknown>): RequestHandler =>
  handler as unknown as RequestHandler;
