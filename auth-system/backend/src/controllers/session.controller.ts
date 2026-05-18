import { Request, Response } from 'express';
import { Session } from '../models/Session';
import { LoginActivity } from '../models/LoginActivity';

// GET /api/sessions
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const sessions = await Session.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

// DELETE /api/sessions/:id
export const revokeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const session = await Session.findOneAndUpdate(
      { _id: id, userId },
      { isRevoked: true }
    );

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session revoked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke session' });
  }
};

// DELETE /api/sessions/revoke-all
export const revokeAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const currentToken = req.cookies.refreshToken;

    await Session.updateMany(
      { userId, refreshToken: { $ne: currentToken } },
      { isRevoked: true }
    );

    res.json({ message: 'All other sessions revoked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke sessions' });
  }
};

// GET /api/sessions/activity
export const getLoginActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const activity = await LoginActivity.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
}; 