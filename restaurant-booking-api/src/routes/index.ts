import { Router } from 'express';
import healthRouter from './health.routes';
import { authRoutes } from './auth.routes';
import { branchRoutes } from './branch.routes';
import { tableRoutes } from './table.routes';
import { bookingRoutes } from './booking.routes';
import { customerRoutes } from './customer.routes';
import { analyticsRoutes } from './analytics.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRoutes);
routes.use('/branches', branchRoutes);
routes.use('/', tableRoutes);
routes.use('/', bookingRoutes);
routes.use('/', customerRoutes);
routes.use('/', analyticsRoutes);

export default routes;
