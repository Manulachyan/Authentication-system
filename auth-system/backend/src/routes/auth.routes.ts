import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  verify2FA,
  sendMagicLink,
  verifyMagicLink,
  googleCallback,
} from '../controllers/auth.controller';
import { authLimiter, magicLinkLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/2fa/verify', authLimiter, verify2FA);
router.post('/magic-link', magicLinkLimiter, sendMagicLink);
router.get('/magic-link/verify/:token', verifyMagicLink);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleCallback);

export default router; 