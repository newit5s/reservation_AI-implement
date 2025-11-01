import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { AppError } from './app-error';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'development-secret';
const JWT_EXPIRE: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE ?? '7d') as SignOptions['expiresIn'];

export const signToken = (
  payload: JwtPayload,
  expiresIn: SignOptions['expiresIn'] = JWT_EXPIRE
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, error);
  }
};
