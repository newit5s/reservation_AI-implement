import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  adjustPointsSchema,
  blacklistSchema,
  createCustomerSchema,
  customerIdParamSchema,
  customerListQuerySchema,
  customerNoteSchema,
  customerPreferenceSchema,
  mergeCustomersSchema,
  redeemRewardSchema,
  searchCustomersQuerySchema,
  updateCustomerSchema,
} from '../validations/customer.validation';
import { controller } from './utils';

const router = Router();

router.use(authenticate);

router.get('/customers', validateRequest(customerListQuerySchema), controller(CustomerController.list));
router.post('/customers', validateRequest(createCustomerSchema), controller(CustomerController.create));
router.get('/customers/search', validateRequest(searchCustomersQuerySchema), controller(CustomerController.search));
router.get('/customers/:id', validateRequest(customerIdParamSchema), controller(CustomerController.get));
router.put('/customers/:id', validateRequest(updateCustomerSchema), controller(CustomerController.update));
router.get('/customers/:id/bookings', validateRequest(customerIdParamSchema), controller(CustomerController.bookings));
router.post('/customers/:id/notes', validateRequest(customerNoteSchema), controller(CustomerController.addNote));
router.put(
  '/customers/:id/preferences',
  validateRequest(customerPreferenceSchema),
  controller(CustomerController.updatePreferences)
);
router.post('/customers/:id/blacklist', validateRequest(blacklistSchema), controller(CustomerController.blacklist));
router.delete(
  '/customers/:id/blacklist',
  validateRequest(customerIdParamSchema),
  controller(CustomerController.removeBlacklist)
);
router.get('/customers/:id/timeline', validateRequest(customerIdParamSchema), controller(CustomerController.timeline));
router.post('/customers/merge', validateRequest(mergeCustomersSchema), controller(CustomerController.merge));
router.get('/customers/:id/loyalty', validateRequest(customerIdParamSchema), controller(CustomerController.loyaltyStatus));
router.get('/customers/:id/points', validateRequest(customerIdParamSchema), controller(CustomerController.loyaltyHistory));
router.post('/customers/:id/points', validateRequest(adjustPointsSchema), controller(CustomerController.adjustPoints));
router.get('/rewards', controller(CustomerController.rewards));
router.post('/rewards/redeem', validateRequest(redeemRewardSchema), controller(CustomerController.redeemReward));
router.get('/customers/:id/referrals', validateRequest(customerIdParamSchema), controller(CustomerController.referrals));
router.get('/customers/:id/export', validateRequest(customerIdParamSchema), controller(CustomerController.export));

export { router as customerRoutes };
