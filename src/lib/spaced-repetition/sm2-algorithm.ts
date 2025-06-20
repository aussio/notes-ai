/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo SM-2 algorithm with simplified correct/wrong ratings
 */

import type { NotecardReviewStats, ReviewResult } from '@/types';

export interface SM2CalculationResult {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate the next review parameters using SM-2 algorithm
 * Simplified to only accept 'correct' or 'wrong' responses
 */
export function calculateNextReview(
  currentStats: NotecardReviewStats,
  result: ReviewResult
): SM2CalculationResult {
  const now = new Date();
  let { easinessFactor, intervalDays, repetitions } = currentStats;

  if (result === 'correct') {
    // Correct answer - increase interval
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }

    // Slightly increase easiness factor for correct answers
    easinessFactor = Math.min(2.5, easinessFactor + 0.1);
  } else {
    // Wrong answer - reset repetitions and decrease easiness factor
    repetitions = 0;
    intervalDays = 1;

    // Decrease easiness factor for wrong answers
    easinessFactor = Math.max(1.3, easinessFactor - 0.2);
  }

  // Calculate next review date
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    easinessFactor,
    intervalDays,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Create initial review stats for a new notecard
 */
export function createInitialReviewStats(
  notecardId: string,
  userId: string
): Omit<NotecardReviewStats, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();

  return {
    notecard_id: notecardId,
    user_id: userId,
    easinessFactor: 2.5, // Default SM-2 starting value
    intervalDays: 1,
    repetitions: 0,
    nextReviewDate: now, // Available for review immediately
    lastReviewDate: null,
    totalReviews: 0,
    correctReviews: 0,
  };
}

/**
 * Check if a card is due for review
 */
export function isCardDue(reviewStats: NotecardReviewStats): boolean {
  const now = new Date();
  return reviewStats.nextReviewDate <= now;
}

/**
 * Check if a card is new (never reviewed)
 */
export function isNewCard(reviewStats: NotecardReviewStats): boolean {
  return reviewStats.totalReviews === 0;
}

/**
 * Calculate retention rate from review stats
 */
export function calculateRetentionRate(
  reviewStats: NotecardReviewStats
): number {
  if (reviewStats.totalReviews === 0) return 0;
  return (reviewStats.correctReviews / reviewStats.totalReviews) * 100;
}

/**
 * Get the next review interval description
 */
export function getIntervalDescription(intervalDays: number): string {
  if (intervalDays === 1) return '1 day';
  if (intervalDays < 7) return `${intervalDays} days`;
  if (intervalDays < 30) {
    const weeks = Math.round(intervalDays / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  const months = Math.round(intervalDays / 30);
  return months === 1 ? '1 month' : `${months} months`;
}
