import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { AppError } from './app-error';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
  } catch (error) {
    throw new AppError('Failed to hash password', 500, error);
  }
};

export const comparePassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) {
      return false;
    }
    const hash = scryptSync(password, salt, KEY_LENGTH);
    const original = Buffer.from(originalHash, 'hex');
    if (hash.length !== original.length) {
      return false;
    }
    return timingSafeEqual(hash, original);
  } catch (error) {
    throw new AppError('Failed to compare password', 500, error);
  }
};
