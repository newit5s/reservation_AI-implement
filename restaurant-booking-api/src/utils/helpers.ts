import { PaginationOptions, PaginatedResult } from '../types';

export const getPagination = (options: PaginationOptions): { skip: number; take: number } => {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.max(options.pageSize ?? 20, 1);
  return {
    skip: (page - 1) * pageSize,
    take: pageSize
  };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> => {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.max(options.pageSize ?? 20, 1);
  return {
    data,
    total,
    page,
    pageSize
  };
};

export const sanitizeObject = <T>(payload: T): T => {
  return JSON.parse(JSON.stringify(payload));
};
