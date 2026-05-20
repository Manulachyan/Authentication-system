import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { LoginActivity as ILoginActivity } from '../types';
import { formatDate, getStatusColor } from '../utils/helpers';

const LoginActivity: React.FC = () => {
  const [activity, setActivity] = useState<ILoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/activity')
      .then(res => setActivity(res.data.activity))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Login Activity
      </h3>

      {activity.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No activity yet</p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto scrollbar-hide">
          {activity.map((item) => (
            <div
              key={item._id}
              className="flex items-start justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <span className={`badge mt-0.5 ${getStatusColor(item.status)}`}>
                  {item.status === 'suspicious' ? '⚠️' : item.status === 'success' ? '✓' : '✕'}
                  {' '}{item.status}
                </span>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.browser} · {item.os}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {item.ip}
                    {item.reason && <span className="ml-1.5 italic">· {item.reason}</span>}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                {formatDate(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginActivity; 