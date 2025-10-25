import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { AuthUser } from '../types/auth';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authorization header missing', 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    role: payload.role as UserRole,
    branchId: payload.branchId ?? null,
  };
  (req as Request & { user?: AuthUser }).user = user;
  next();
};
