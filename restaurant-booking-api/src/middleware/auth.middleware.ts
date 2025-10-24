import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/app-error';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authorization header missing', 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  (req as Request & { user?: typeof payload }).user = payload;
  next();
};
