import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { BranchSummary, BranchTrendPoint } from '../types';

export const useBranchSummary = (branchId: string) =>
  useQuery<BranchSummary>({
    queryKey: ['analytics', 'summary', branchId],
    queryFn: () => analyticsService.getSummary(branchId),
    enabled: Boolean(branchId),
  });

export const useBranchTrends = (branchId: string, days = 7) =>
  useQuery<BranchTrendPoint[]>({
    queryKey: ['analytics', 'trends', branchId, days],
    queryFn: () => analyticsService.getTrends(branchId, days),
    enabled: Boolean(branchId),
  });
