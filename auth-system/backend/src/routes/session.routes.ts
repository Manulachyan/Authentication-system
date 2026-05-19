import { Router } from 'express';
import {
  getSessions,
  revokeSession,
  revokeAllSessions,
  getLoginActivity,
} from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate, generalLimiter);

router.get('/', getSessions);
router.get('/activity', getLoginActivity);
router.delete('/revoke-all', revokeAllSessions);
router.delete('/:id', revokeSession);

export default router; 