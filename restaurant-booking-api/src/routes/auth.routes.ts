import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshSchema,
} from '../validations/auth.validation';
import { loginRateLimiter } from '../middleware/login-rate-limit.middleware';

const router = Router();

router.post('/login', loginRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh', validateRequest(refreshSchema), AuthController.refresh);
router.post('/logout', validateRequest(refreshSchema), AuthController.logout);
router.post(
  '/password/request-reset',
  validateRequest(passwordResetRequestSchema),
  AuthController.requestPasswordReset
);
router.post('/password/reset', validateRequest(passwordResetSchema), AuthController.resetPassword);

export { router as authRoutes };
