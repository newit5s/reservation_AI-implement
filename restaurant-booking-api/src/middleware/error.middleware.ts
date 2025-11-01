import { NextFunction, Request, Response } from 'express';
import { AppError, isAppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): Response => {
  const error = isAppError(err) ? err : new AppError('Internal Server Error', 500, err, false);

  if (!isAppError(err)) {
    logger.error(err.message, { stack: err.stack });
  }

  return res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
    details: error.details ?? undefined,
  });
};
