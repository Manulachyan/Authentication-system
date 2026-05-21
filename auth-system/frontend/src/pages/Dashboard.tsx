import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SecurityScore from '../components/SecurityScore';
import SessionMonitor from '../components/SessionMonitor';
import LoginActivity from '../components/LoginActivity';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, refreshUser, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth token from URL (Google login redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      // Fetch user with this token
      api.get('/user/me').then(res => {
        login(token, res.data.user);
        // Clean token from URL
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        navigate('/login');
      });
    }
  }, []);

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA
  const [qrCode, setQrCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showing2FA, setShowing2FA] = useState(false);
  const [tfaLoading, setTfaLoading] = useState(false);

  // Active tab
  const [tab, setTab] = useState<'overview' | 'security' | 'sessions' | 'activity'>('overview');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/user/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setTfaLoading(true);
    try {
      const res = await api.post('/user/2fa/setup');
      // res.data.qrCode is a base64 PNG data URL from qrcode library
      setQrCode(res.data.qrCode);
      setShowing2FA(true);
    } catch {
      toast.error('Failed to setup 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  const handle2FAEnable = async () => {
    if (otpInput.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setTfaLoading(true);
    try {
      await api.post('/user/2fa/enable', { otp: otpInput });
      toast.success('2FA enabled successfully!');
      setShowing2FA(false);
      setQrCode('');
      setOtpInput('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setTfaLoading(false);
    }
  };

  const handle2FADisable = async () => {
    const otp = window.prompt('Enter your current OTP to disable 2FA:');
    if (!otp) return;
    try {
      await api.post('/user/2fa/disable', { otp });
      toast.success('2FA disabled');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'sessions', label: 'Sessions', icon: '💻' },
    { id: 'activity', label: 'Activity', icon: '📋' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">Welcome back, {user?.name}! 👋</h2>
              <p className="text-primary-100 text-sm mt-1">
                {user?.isEmailVerified ? '✓ Email verified' : '⚠ Email not verified'} ·{' '}
                {user?.twoFactorEnabled ? '✓ 2FA enabled' : '⚠ 2FA not enabled'} ·{' '}
                <span className="capitalize">{user?.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!user?.isEmailVerified && (
                <span className="badge bg-yellow-400/20 text-yellow-200 border border-yellow-400/30">
                  ⚠ Verify Email
                </span>
              )}
              <span className={`badge ${user?.role === 'admin'
                ? 'bg-purple-400/20 text-purple-200 border border-purple-400/30'
                : 'bg-white/20 text-white border border-white/30'}`}>
                {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                ${tab === t.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">

          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SecurityScore />
              <div className="card">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Info
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: user?.name },
                    { label: 'Email', value: user?.email },
                    { label: 'Role', value: user?.role },
                    { label: 'Email Verified', value: user?.isEmailVerified ? 'Yes ✓' : 'No ✗' },
                    { label: '2FA', value: user?.twoFactorEnabled ? 'Enabled ✓' : 'Disabled' },
                    { label: 'Google Linked', value: user?.googleId ? 'Yes ✓' : 'No' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Change Password */}
              <div className="card">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    required
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    required
                    className="input-field"
                  />
                  <button type="submit" disabled={pwLoading} className="btn-primary">
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* 2FA */}
              <div className="card">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Use an authenticator app like Google Authenticator or Authy.
                </p>

                {user?.twoFactorEnabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">2FA is active and protecting your account</span>
                    </div>
                    <button onClick={handle2FADisable} className="btn-secondary !text-red-500 dark:!text-red-400">
                      Disable 2FA
                    </button>
                  </div>

                ) : showing2FA && qrCode ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      1. Open <strong>Google Authenticator</strong> or <strong>Authy</strong><br />
                      2. Tap <strong>+</strong> → <strong>Scan QR code</strong><br />
                      3. Enter the 6-digit code below
                    </p>

                    {/* QR Code — use img tag since backend returns base64 PNG */}
                    <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                      <img
                        src={qrCode}
                        alt="2FA QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="input-field text-center text-xl tracking-[0.5em] font-bold"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowing2FA(false); setQrCode(''); setOtpInput(''); }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handle2FAEnable}
                        disabled={tfaLoading || otpInput.length !== 6}
                        className="btn-primary"
                      >
                        {tfaLoading ? 'Verifying...' : 'Enable 2FA ✓'}
                      </button>
                    </div>
                  </div>

                ) : (
                  <button onClick={handle2FASetup} disabled={tfaLoading} className="btn-primary">
                    {tfaLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Setting up...
                      </span>
                    ) : 'Setup 2FA'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sessions */}
          {tab === 'sessions' && (
            <div className="max-w-2xl">
              <SessionMonitor />
            </div>
          )}

          {/* Activity */}
          {tab === 'activity' && (
            <div className="max-w-2xl">
              <LoginActivity />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;