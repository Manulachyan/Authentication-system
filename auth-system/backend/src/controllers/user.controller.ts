import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { computeSecurityScore } from '../utils/securityScore';
import { generateTOTPSecret, generateQRCode } from '../services/otp.service';
import { verifyOTP } from '../services/otp.service';

// GET /api/user/me
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId).select('-password -twoFactorSecret -emailVerificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// PUT /api/user/me
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret');

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// PUT /api/user/change-password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.password) return res.status(404).json({ message: 'User not found' });

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed' });
  }
};

// GET /api/user/security-score
export const getSecurityScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const score = computeSecurityScore(user);
    res.json({ score });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute score' });
  }
};

// POST /api/user/2fa/setup
export const setup2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = generateTOTPSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const qrCode = await generateQRCode(user.email, secret);
    res.json({ secret, qrCode });
  } catch (err) {
    res.status(500).json({ message: '2FA setup failed' });
  }
};

// POST /api/user/2fa/enable
export const enable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { otp } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) return res.status(404).json({ message: 'Setup 2FA first' });

    const isValid = verifyOTP(otp, user.twoFactorSecret);
    if (!isValid) return res.status(401).json({ message: 'Invalid OTP' });

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable 2FA' });
  }
};

// POST /api/user/2fa/disable
export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { otp } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) return res.status(404).json({ message: 'User not found' });

    const isValid = verifyOTP(otp, user.twoFactorSecret);
    if (!isValid) return res.status(401).json({ message: 'Invalid OTP' });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

// GET /api/user/all  (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password -twoFactorSecret').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// DELETE /api/user/:id  (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
}; 