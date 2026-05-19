import { IUser } from '../models/User';
import { getPasswordStrength } from './password';

export interface SecurityScoreResult {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    label: string;
    earned: number;
    max: number;
    passed: boolean;
  }[];
}

export const computeSecurityScore = (user: IUser): SecurityScoreResult => {
  const breakdown = [
    {
      label: 'Email Verified',
      earned: user.isEmailVerified ? 25 : 0,
      max: 25,
      passed: user.isEmailVerified,
    },
    {
      label: '2FA Enabled',
      earned: user.twoFactorEnabled ? 35 : 0,
      max: 35,
      passed: user.twoFactorEnabled,
    },
    {
      label: 'Password Strength',
      earned: user.password
        ? getPasswordStrength(user.password) === 'strong'
          ? 30
          : getPasswordStrength(user.password) === 'medium'
          ? 15
          : 0
        : 0,
      max: 30,
      passed: user.password
        ? ['medium', 'strong'].includes(getPasswordStrength(user.password))
        : false,
    },
    {
      label: 'OAuth Linked',
      earned: user.googleId ? 10 : 0,
      max: 10,
      passed: !!user.googleId,
    },
  ];

  const score = breakdown.reduce((acc, item) => acc + item.earned, 0);
  const maxScore = breakdown.reduce((acc, item) => acc + item.max, 0);

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    breakdown,
  };
}; 