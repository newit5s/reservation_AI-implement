import { z } from 'zod';

export const branchAnalyticsSummarySchema = z.object({
  params: z.object({
    branchId: z.string().uuid(),
  }),
  query: z.object({
    date: z.string().datetime().optional(),
  }),
});

export const branchAnalyticsTrendsSchema = z.object({
  params: z.object({
    branchId: z.string().uuid(),
  }),
  query: z.object({
    days: z.coerce.number().int().positive().max(30).optional(),
    date: z.string().datetime().optional(),
  }),
});

export type BranchAnalyticsSummaryQuery = z.infer<typeof branchAnalyticsSummarySchema>['query'];
export type BranchAnalyticsTrendsQuery = z.infer<typeof branchAnalyticsTrendsSchema>['query'];
