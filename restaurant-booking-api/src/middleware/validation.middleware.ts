import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import { AppError } from '../utils/app-error';

export const validateRequest =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      throw new AppError('Validation failed', 400, result.error.flatten());
    }

    next();
  };
