'use client';

import React, { useEffect } from 'react';
import { useReviewStore, useReviewStatistics } from '@/store/reviewStore';

export const ReviewStatistics: React.FC = () => {
  const { loadStatistics } = useReviewStore();
  const statistics = useReviewStatistics();

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (!statistics) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const { totalCards, dueCards, newCards, retentionRate } = statistics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cards"
          value={totalCards}
          icon="📚"
          color="blue"
        />
        <StatCard
          title="Due for Review"
          value={dueCards}
          icon="⏰"
          color="orange"
          urgent={dueCards > 0}
        />
        <StatCard title="New Cards" value={newCards} icon="✨" color="green" />
        <StatCard
          title="Retention Rate"
          value={`${retentionRate.toFixed(1)}%`}
          icon="🎯"
          color="purple"
        />
      </div>



      {/* Progress Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Progress
        </h3>

        {totalCards === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              📝
            </div>
            <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No Cards Yet
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first notecard to start your spaced repetition
              journey!
            </p>
            <a
              href="/notecards"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Card
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Retention Rate Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Retention Rate
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {retentionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    retentionRate >= 80
                      ? 'bg-green-600'
                      : retentionRate >= 60
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(retentionRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Study Recommendations
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {dueCards > 20 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-500">⚠️</span>
                    <span>
                      You have {dueCards} cards due. Consider reviewing them to
                      maintain your learning progress.
                    </span>
                  </div>
                )}

                {retentionRate < 60 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500">📉</span>
                    <span>
                      Your retention rate is below 60%. Focus on reviewing cards
                      more frequently to improve.
                    </span>
                  </div>
                )}

                {retentionRate >= 80 && dueCards === 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500">🎉</span>
                    <span>
                      Excellent work! Your retention rate is above 80% and
                      you&apos;re up to date with reviews.
                    </span>
                  </div>
                )}

                {newCards > 0 && dueCards === 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500">💡</span>
                    <span>
                      Ready to learn? You have {newCards} new cards waiting to
                      be studied.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
  urgent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  urgent,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    orange: urgent
      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 ring-2 ring-orange-300 dark:ring-orange-700'
      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
    green:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    purple:
      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
};
