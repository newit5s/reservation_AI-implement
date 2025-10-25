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

const router = Router();

router.use(authenticate);

router.get('/', validateRequest(listBranchesSchema), BranchController.list);
router.get('/:id', validateRequest(branchIdParamSchema), BranchController.get);
router.post('/', validateRequest(createBranchSchema), BranchController.create);
router.put('/:id', validateRequest(updateBranchSchema), BranchController.update);
router.delete('/:id', validateRequest(branchIdParamSchema), BranchController.remove);
router.get('/:id/settings', validateRequest(branchIdParamSchema), BranchController.getSettings);
router.put('/:id/settings', validateRequest(updateSettingsSchema), BranchController.updateSettings);
router.get(
  '/:id/operating-hours',
  validateRequest(branchIdParamSchema),
  BranchController.getOperatingHours
);
router.put(
  '/:id/operating-hours',
  validateRequest(updateOperatingHoursSchema),
  BranchController.updateOperatingHours
);
router.get(
  '/:id/blocked-slots',
  validateRequest(branchIdParamSchema),
  BranchController.listBlockedSlots
);
router.post(
  '/:id/blocked-slots',
  validateRequest(createBlockedSlotSchema),
  BranchController.createBlockedSlot
);
router.delete(
  '/:id/blocked-slots',
  validateRequest(deleteBlockedSlotsSchema),
  BranchController.deleteBlockedSlots
);

export { router as branchRoutes };
