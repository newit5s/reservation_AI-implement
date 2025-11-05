import { apiClient } from './api';
import { ApiResponse, BranchSummary, BranchTrendPoint } from '../types';

export const analyticsService = {
  async getSummary(branchId: string): Promise<BranchSummary> {
    const { data } = await apiClient.get<ApiResponse<BranchSummary>>(
      `analytics/branches/${branchId}/summary`
    );
    return data.data;
  },
  async getTrends(branchId: string, days = 7): Promise<BranchTrendPoint[]> {
    const { data } = await apiClient.get<ApiResponse<BranchTrendPoint[]>>(
      `analytics/branches/${branchId}/trends`,
      { params: { days } }
    );
    return data.data;
  },
};
