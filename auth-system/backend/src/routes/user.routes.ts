import { Router } from 'express';
import {
  getMe,
  updateMe,
  changePassword,
  getSecurityScore,
  setup2FA,
  enable2FA,
  disable2FA,
  getAllUsers,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate, generalLimiter);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/change-password', changePassword);
router.get('/security-score', getSecurityScore);
router.post('/2fa/setup', setup2FA);
router.post('/2fa/enable', enable2FA);
router.post('/2fa/disable', disable2FA);

// Admin only
router.get('/all', requireRole('admin'), getAllUsers);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router; 