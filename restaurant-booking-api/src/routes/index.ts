import { Router } from 'express';
import healthRouter from './health.routes';
import { authRoutes } from './auth.routes';
import { branchRoutes } from './branch.routes';
import { tableRoutes } from './table.routes';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRoutes);
routes.use('/branches', branchRoutes);
routes.use('/', tableRoutes);

export default routes;
