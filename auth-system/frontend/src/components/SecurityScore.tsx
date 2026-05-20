import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { SecurityScore as ISecurityScore } from '../types';

const SecurityScore: React.FC = () => {
  const [score, setScore] = useState<ISecurityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/security-score')
      .then(res => setScore(res.data.score))
      .finally(() => setLoading(false));
  }, []);

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Excellent' };
    if (pct >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', label: 'Fair' };
    return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Weak' };
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!score) return null;

  const colors = getScoreColor(score.percentage);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security Score
        </h3>
        <span className={`text-2xl font-bold ${colors.text}`}>
          {score.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-1">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${score.percentage}%` }}
        />
      </div>
      <p className={`text-xs font-medium mb-5 ${colors.text}`}>{colors.label}</p>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {score.breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${item.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {item.passed ? (
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
            </div>
            <span className={`text-xs font-semibold ${item.passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              +{item.earned}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityScore; 