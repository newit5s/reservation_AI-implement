import { Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AuthenticatedRequest } from '../types/requests';
import { BranchAnalyticsSummaryQuery, BranchAnalyticsTrendsQuery } from '../validations/analytics.validation';

export class AnalyticsController {
  static async summary(
    req: AuthenticatedRequest<{ branchId: string }, unknown, unknown, BranchAnalyticsSummaryQuery>,
    res: Response
  ): Promise<void> {
    const { branchId } = req.params;
    const { date } = req.query;
    const summary = await analyticsService.getBranchSummary(branchId, date ? new Date(date) : new Date());
    res.json({ data: summary });
  }

  static async trends(
    req: AuthenticatedRequest<{ branchId: string }, unknown, unknown, BranchAnalyticsTrendsQuery>,
    res: Response
  ): Promise<void> {
    const { branchId } = req.params;
    const { days, date } = req.query;
    const reference = date ? new Date(date) : new Date();
    const trendData = await analyticsService.getBranchTrends(branchId, days ?? undefined, reference);
    res.json({ data: trendData });
  }
}
