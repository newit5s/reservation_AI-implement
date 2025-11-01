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
import { controller } from './utils';

const router = Router();

router.use(authenticate);

router.get(
  '/branches/:branchId/tables',
  validateRequest(branchTablesParamSchema),
  controller(TableController.list)
);
router.post(
  '/branches/:branchId/tables',
  validateRequest(createTableSchema),
  controller(TableController.create)
);
router.get(
  '/branches/:branchId/layout',
  validateRequest(branchTablesParamSchema),
  controller(TableController.layout)
);
router.put(
  '/branches/:branchId/layout',
  validateRequest(updateLayoutSchema),
  controller(TableController.updateLayout)
);
router.put('/tables/:id', validateRequest(updateTableSchema), controller(TableController.update));
router.delete('/tables/:id', validateRequest(tableIdParamSchema), controller(TableController.remove));
router.put('/tables/:id/status', validateRequest(updateStatusSchema), controller(TableController.updateStatus));
router.get(
  '/tables/:id/availability',
  validateRequest(tableAvailabilityQuerySchema),
  controller(TableController.availability)
);
router.post(
  '/tables/check-availability',
  validateRequest(bulkAvailabilitySchema),
  controller(TableController.bulkAvailability)
);
router.post('/tables/combine', validateRequest(combineTablesSchema), controller(TableController.combine));

export { router as tableRoutes };
