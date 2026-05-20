import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Session } from '../types';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const SessionMonitor: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.sessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const revokeSession = async (id: string) => {
    try {
      await api.delete(`/sessions/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAll = async () => {
    try {
      await api.delete('/sessions/revoke-all');
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke sessions');
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="card animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Active Sessions
          <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            {sessions.length}
          </span>
        </h3>
        {sessions.length > 1 && (
          <button
            onClick={revokeAll}
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Revoke all others
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No active sessions</p>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session, index) => (
            <div
              key={session._id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  {getDeviceIcon(session.deviceInfo.device)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {session.deviceInfo.browser}
                    </p>
                    {index === 0 && (
                      <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.deviceInfo.os} · {session.deviceInfo.ip}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
              </div>
              {index !== 0 && (
                <button
                  onClick={() => revokeSession(session._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs font-medium text-red-500 hover:text-red-700 transition-all"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionMonitor; 