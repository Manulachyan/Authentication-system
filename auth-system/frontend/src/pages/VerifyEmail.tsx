import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token found in URL');
      return;
    }

    const verify = async () => {
      try {
        const isMagicLink = location.pathname.includes('magic-link');

        if (isMagicLink) {
          const res = await api.get(`/auth/magic-link/verify/${token}`);
          login(res.data.accessToken, res.data.user);
          setStatus('success');
          setMessage('Logged in successfully via magic link!');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          await api.get(`/auth/verify-email/${token}`);
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2500);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Invalid or expired token'
        );
        // Log for debugging
        console.error('Verification error:', err.response?.data);
      }
    };

    verify();
  }, [token, location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full text-center shadow-xl animate-slide-up py-10">

        {status === 'loading' && (
          <>
            <div className="w-14 h-14 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Verifying your email...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-9 h-9 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
            <div className="mt-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-9 h-9 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;