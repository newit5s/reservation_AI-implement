import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { controller } from './utils';
import { AnalyticsController } from '../controllers/analytics.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { branchAnalyticsSummarySchema, branchAnalyticsTrendsSchema } from '../validations/analytics.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/analytics/branches/:branchId/summary',
  validateRequest(branchAnalyticsSummarySchema),
  controller(AnalyticsController.summary)
);

router.get(
  '/analytics/branches/:branchId/trends',
  validateRequest(branchAnalyticsTrendsSchema),
  controller(AnalyticsController.trends)
);

export { router as analyticsRoutes };
