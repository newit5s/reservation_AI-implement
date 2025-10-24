import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  branchTablesParamSchema,
  bulkAvailabilitySchema,
  combineTablesSchema,
  createTableSchema,
  tableAvailabilityQuerySchema,
  tableIdParamSchema,
  updateLayoutSchema,
  updateStatusSchema,
  updateTableSchema,
} from '../validations/table.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/branches/:branchId/tables',
  validateRequest(branchTablesParamSchema),
  TableController.list
);
router.post(
  '/branches/:branchId/tables',
  validateRequest(createTableSchema),
  TableController.create
);
router.get(
  '/branches/:branchId/layout',
  validateRequest(branchTablesParamSchema),
  TableController.layout
);
router.put(
  '/branches/:branchId/layout',
  validateRequest(updateLayoutSchema),
  TableController.updateLayout
);
router.put('/tables/:id', validateRequest(updateTableSchema), TableController.update);
router.delete('/tables/:id', validateRequest(tableIdParamSchema), TableController.remove);
router.put('/tables/:id/status', validateRequest(updateStatusSchema), TableController.updateStatus);
router.get(
  '/tables/:id/availability',
  validateRequest(tableAvailabilityQuerySchema),
  TableController.availability
);
router.post(
  '/tables/check-availability',
  validateRequest(bulkAvailabilitySchema),
  TableController.bulkAvailability
);
router.post('/tables/combine', validateRequest(combineTablesSchema), TableController.combine);

export { router as tableRoutes };
