'use client';

import React, { useEffect, useState } from 'react';
import { spacedRepetitionDatabase } from '@/lib/spaced-repetition/database';
import { useUser } from '@/store/authStore';
import type { NotecardReviewStats } from '@/types';

interface NotecardStatsProps {
  notecardId: string;
  className?: string;
}

export const NotecardStats: React.FC<NotecardStatsProps> = ({
  notecardId,
  className = '',
}) => {
  const user = useUser();
  const [stats, setStats] = useState<NotecardReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user || !notecardId) return;

      try {
        setIsLoading(true);
        const reviewStats = await spacedRepetitionDatabase.getReviewStats(
          notecardId,
          user.id
        );
        setStats(reviewStats || null);
      } catch (error) {
        console.error('Failed to load notecard stats:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [notecardId, user]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex gap-4 text-xs text-gray-500">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`${className}`}>
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>📝 New Card</span>
          <span>Never Reviewed</span>
        </div>
      </div>
    );
  }

  const retentionRate =
    stats.totalReviews > 0
      ? Math.round((stats.correctReviews / stats.totalReviews) * 100)
      : 0;

  const isOverdue = stats.nextReviewDate < new Date();
  const daysSinceLastReview = stats.lastReviewDate
    ? Math.floor(
        (Date.now() - stats.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className={`${className}`}>
      <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          📊 {retentionRate}% accuracy
        </span>
        <span className="flex items-center gap-1">
          🔄 {stats.totalReviews} reviews
        </span>
        <span className="flex items-center gap-1">
          {isOverdue ? '🔴' : '🟢'}
          {isOverdue
            ? 'Due now'
            : `Next: ${Math.ceil((stats.nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d`}
        </span>
        {daysSinceLastReview !== null && (
          <span className="flex items-center gap-1">
            ⏱️ {daysSinceLastReview}d ago
          </span>
        )}
      </div>
    </div>
  );
};
