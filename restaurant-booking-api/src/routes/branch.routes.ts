import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  branchIdParamSchema,
  createBlockedSlotSchema,
  createBranchSchema,
  deleteBlockedSlotsSchema,
  listBranchesSchema,
  updateBranchSchema,
  updateOperatingHoursSchema,
  updateSettingsSchema,
} from '../validations/branch.validation';
import { controller } from './utils';

const router = Router();

router.use(authenticate);

router.get('/', validateRequest(listBranchesSchema), controller(BranchController.list));
router.get('/:id', validateRequest(branchIdParamSchema), controller(BranchController.get));
router.post('/', validateRequest(createBranchSchema), controller(BranchController.create));
router.put('/:id', validateRequest(updateBranchSchema), controller(BranchController.update));
router.delete('/:id', validateRequest(branchIdParamSchema), controller(BranchController.remove));
router.get('/:id/settings', validateRequest(branchIdParamSchema), controller(BranchController.getSettings));
router.put('/:id/settings', validateRequest(updateSettingsSchema), controller(BranchController.updateSettings));
router.get(
  '/:id/operating-hours',
  validateRequest(branchIdParamSchema),
  controller(BranchController.getOperatingHours)
);
router.put(
  '/:id/operating-hours',
  validateRequest(updateOperatingHoursSchema),
  controller(BranchController.updateOperatingHours)
);
router.get(
  '/:id/blocked-slots',
  validateRequest(branchIdParamSchema),
  controller(BranchController.listBlockedSlots)
);
router.post(
  '/:id/blocked-slots',
  validateRequest(createBlockedSlotSchema),
  controller(BranchController.createBlockedSlot)
);
router.delete(
  '/:id/blocked-slots',
  validateRequest(deleteBlockedSlotsSchema),
  controller(BranchController.deleteBlockedSlots)
);

export { router as branchRoutes };
