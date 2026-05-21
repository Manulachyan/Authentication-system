export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  googleId?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Session {
  _id: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    ip: string;
  };
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface LoginActivity {
  _id: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  status: 'success' | 'failed' | 'suspicious';
  reason?: string;
  createdAt: string;
}

export interface SecurityScore {
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

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  message: string;
} 