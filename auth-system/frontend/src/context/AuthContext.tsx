import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/user/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  // On mount: try to restore session
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setAccessToken(token);
        try {
          const res = await api.get('/user/me');
          setUser(res.data.user);
        } catch {
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}; 