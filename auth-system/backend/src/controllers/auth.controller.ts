import { Request, Response } from 'express';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { LoginActivity } from '../models/LoginActivity';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/token.service';
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail, sendSuspiciousLoginEmail } from '../services/email.service';
import { verifyOTP } from '../services/otp.service';
import { parseDevice } from '../utils/deviceParser';
import { redis } from '../config/redis';
import { ENV } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password: hashed,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Registered successfully. Please verify your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = parseDevice(req);

    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

    // Check lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      await user.save();

      await LoginActivity.create({ userId: user._id, ...deviceInfo, status: 'failed', reason: 'Wrong password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Suspicious login detection (simulate: different IP)
    const lastActivity = await LoginActivity.findOne({ userId: user._id, status: 'success' }).sort({ createdAt: -1 });
    if (lastActivity && lastActivity.ip !== deviceInfo.ip) {
      await sendSuspiciousLoginEmail(user.email, deviceInfo);
      await LoginActivity.create({ userId: user._id, ...deviceInfo, status: 'suspicious', reason: 'New IP detected' });
    } else {
      await LoginActivity.create({ userId: user._id, ...deviceInfo, status: 'success' });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ userId: user._id, require2FA: true }, ENV.JWT_ACCESS_SECRET, { expiresIn: '5m' });
      return res.json({ require2FA: true, tempToken });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = verifyRefreshToken(token);
    const session = await Session.findOne({ refreshToken: token, isRevoked: false });
    if (!session) return res.status(401).json({ message: 'Invalid session' });

    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await Session.findOneAndUpdate({ refreshToken: token }, { isRevoked: true });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

// GET /api/auth/verify-email/:token
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    // Accept token from path param or query param and be tolerant to minor encoding issues
    const rawToken = (req.params.token || req.query.token || '').toString();
    const token = rawToken.trim();

    console.log(`[verifyEmail] incoming token: "${rawToken}"`);

    // Try direct lookup first
    let user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    // If not found, try decodeURIComponent (in case token was encoded differently)
    if (!user && rawToken) {
      try {
        const decoded = decodeURIComponent(rawToken);
        if (decoded !== rawToken) {
          console.log('[verifyEmail] trying decoded token');
          user = await User.findOne({
            emailVerificationToken: decoded,
            emailVerificationExpires: { $gt: new Date() },
          });
        }
      } catch (e) {
        console.log('[verifyEmail] decodeURIComponent failed', e);
      }
    }

    // If still not found, log potential causes and return failure
    if (!user) {
      console.log('[verifyEmail] token lookup failed. Token:', token);
      // Helpful diagnostic: search for any user that has a similar token prefix (first 8 chars)
      if (token && token.length >= 8) {
        const prefix = token.slice(0, 8);
        const maybe = await User.findOne({ emailVerificationToken: { $regex: `^${prefix}` } }).select('email emailVerificationToken emailVerificationExpires');
        if (maybe) console.log('[verifyEmail] found user with matching prefix:', maybe.email, maybe.emailVerificationToken?.slice(0, 16), maybe.emailVerificationExpires);
      }

      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('[verifyEmail] successfully verified:', user.email);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

// POST /api/auth/resend-verification
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, verificationToken);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Request failed' });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke all sessions
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed' });
  }
};

// POST /api/auth/2fa/verify
export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { tempToken, otp } = req.body;
    const payload = jwt.verify(tempToken, ENV.JWT_ACCESS_SECRET) as { userId: string; require2FA: boolean };

    if (!payload.require2FA) return res.status(400).json({ message: 'Invalid token' });

    const user = await User.findById(payload.userId);
    if (!user || !user.twoFactorSecret) return res.status(404).json({ message: 'User not found' });

    const isValid = verifyOTP(otp, user.twoFactorSecret);
    if (!isValid) return res.status(401).json({ message: 'Invalid OTP' });

    const deviceInfo = parseDevice(req);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(401).json({ message: '2FA verification failed' });
  }
};

// POST /api/auth/magic-link
export const sendMagicLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a magic link was sent.' });

    const token = jwt.sign({ userId: user._id }, ENV.MAGIC_LINK_SECRET, { expiresIn: ENV.MAGIC_LINK_EXPIRES as any });
    await sendMagicLinkEmail(email, token);

    res.json({ message: 'If that email exists, a magic link was sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send magic link' });
  }
};

// GET /api/auth/magic-link/verify/:token
export const verifyMagicLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const payload = jwt.verify(token, ENV.MAGIC_LINK_SECRET) as { userId: string };

    // Check if already used (stored in Redis)
    const used = await redis.get(`magic:${token}`);
    if (used) return res.status(400).json({ message: 'Magic link already used' });

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mark as used
    await redis.set(`magic:${token}`, '1', 'EX', 600);

    const deviceInfo = parseDevice(req);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired magic link' });
  }
};

// Google OAuth callback handler
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const deviceInfo = parseDevice(req);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${ENV.CLIENT_URL}/dashboard?token=${accessToken}`);
  } catch (err) {
    res.redirect(`${ENV.CLIENT_URL}/login?error=oauth_failed`);
  }
}; 