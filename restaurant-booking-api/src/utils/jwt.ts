import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { AppError } from './app-error';

const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE ?? '7d';

export const signToken = (payload: JwtPayload, expiresIn: string | number = JWT_EXPIRE): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, error);
  }
};
