import { Session } from '../models/Session';
import { redis } from '../config/redis';

export const getActiveSessions = async (userId: string) => {
  return Session.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

export const revokeSessionByToken = async (refreshToken: string) => {
  await Session.findOneAndUpdate({ refreshToken }, { isRevoked: true });
};

export const revokeAllUserSessions = async (userId: string, exceptToken?: string) => {
  const query: any = { userId, isRevoked: false };
  if (exceptToken) query.refreshToken = { $ne: exceptToken };
  await Session.updateMany(query, { isRevoked: true });
};

export const blacklistAccessToken = async (token: string, expiresInSeconds: number) => {
  await redis.set(`blacklist:${token}`, '1', 'EX', expiresInSeconds);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
}; 