/**
 * Tests for SM-2 Spaced Repetition Algorithm
 */

import {
  calculateNextReview,
  createInitialReviewStats,
  isCardDue,
  isNewCard,
  calculateRetentionRate,
  getIntervalDescription,
} from '@/lib/spaced-repetition/sm2-algorithm';
import type { NotecardReviewStats } from '@/types';

// Helper function to create mock review stats
const createMockReviewStats = (
  overrides: Partial<NotecardReviewStats> = {}
): NotecardReviewStats => {
  const now = new Date();
  return {
    id: 'test-stats-id',
    notecard_id: 'test-notecard-id',
    user_id: 'test-user-id',
    easinessFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    nextReviewDate: now,
    lastReviewDate: null,
    totalReviews: 0,
    correctReviews: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe('SM-2 Algorithm', () => {
  describe('calculateNextReview', () => {
    it('should handle first correct review (repetition 1)', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
      });

      const result = calculateNextReview(stats, 'correct');

      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBe(2.5); // Capped at 2.5
      expect(result.nextReviewDate).toBeInstanceOf(Date);

      // Should be 1 day from now
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 1);
      expect(result.nextReviewDate.getDate()).toBe(expectedDate.getDate());
    });

    it('should handle second correct review (repetition 2)', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.4,
        intervalDays: 1,
        repetitions: 1,
      });

      const result = calculateNextReview(stats, 'correct');

      expect(result.repetitions).toBe(2);
      expect(result.intervalDays).toBe(6);
      expect(result.easinessFactor).toBe(2.5); // 2.4 + 0.1 = 2.5
    });

    it('should handle subsequent correct reviews with easiness factor multiplication', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.3,
        intervalDays: 6,
        repetitions: 2,
      });

      const result = calculateNextReview(stats, 'correct');

      expect(result.repetitions).toBe(3);
      expect(result.intervalDays).toBe(Math.round(6 * 2.3)); // 14
      expect(result.easinessFactor).toBe(2.4); // 2.3 + 0.1
    });

    it('should cap easiness factor at 2.5 for correct answers', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.5,
        intervalDays: 14,
        repetitions: 3,
      });

      const result = calculateNextReview(stats, 'correct');

      expect(result.easinessFactor).toBe(2.5); // Should not exceed 2.5
      expect(result.repetitions).toBe(4);
      expect(result.intervalDays).toBe(Math.round(14 * 2.5)); // 35
    });

    it('should reset repetitions and reduce easiness factor for wrong answers', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.3,
        intervalDays: 14,
        repetitions: 3,
      });

      const result = calculateNextReview(stats, 'wrong');

      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBeCloseTo(2.1, 10); // 2.3 - 0.2
    });

    it('should not let easiness factor go below 1.3 for wrong answers', () => {
      const stats = createMockReviewStats({
        easinessFactor: 1.3,
        intervalDays: 6,
        repetitions: 2,
      });

      const result = calculateNextReview(stats, 'wrong');

      expect(result.easinessFactor).toBe(1.3); // Should not go below 1.3
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
    });

    it('should calculate next review date correctly', () => {
      const stats = createMockReviewStats({
        easinessFactor: 2.0,
        intervalDays: 3,
        repetitions: 1,
      });

      const result = calculateNextReview(stats, 'correct');

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 6); // Second repetition = 6 days

      expect(result.nextReviewDate.getDate()).toBe(expectedDate.getDate());
      expect(result.nextReviewDate.getMonth()).toBe(expectedDate.getMonth());
    });
  });

  describe('createInitialReviewStats', () => {
    it('should create initial stats with correct default values', () => {
      const notecardId = 'test-notecard-123';
      const userId = 'test-user-456';

      const stats = createInitialReviewStats(notecardId, userId);

      expect(stats.notecard_id).toBe(notecardId);
      expect(stats.user_id).toBe(userId);
      expect(stats.easinessFactor).toBe(2.5);
      expect(stats.intervalDays).toBe(1);
      expect(stats.repetitions).toBe(0);
      expect(stats.lastReviewDate).toBe(null);
      expect(stats.totalReviews).toBe(0);
      expect(stats.correctReviews).toBe(0);
      expect(stats.nextReviewDate).toBeInstanceOf(Date);

      // Should be available for review immediately (within a few seconds of now)
      const now = new Date();
      const timeDiff = Math.abs(stats.nextReviewDate.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });
  });

  describe('isCardDue', () => {
    it('should return true for cards due now', () => {
      const stats = createMockReviewStats({
        nextReviewDate: new Date(), // Due now
      });

      expect(isCardDue(stats)).toBe(true);
    });

    it('should return true for overdue cards', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const stats = createMockReviewStats({
        nextReviewDate: pastDate,
      });

      expect(isCardDue(stats)).toBe(true);
    });

    it('should return false for cards not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const stats = createMockReviewStats({
        nextReviewDate: futureDate,
      });

      expect(isCardDue(stats)).toBe(false);
    });

    it('should handle edge case of cards due in the past by hours', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago

      const stats = createMockReviewStats({
        nextReviewDate: pastDate,
      });

      expect(isCardDue(stats)).toBe(true);
    });
  });

  describe('isNewCard', () => {
    it('should return true for cards that have never been reviewed', () => {
      const stats = createMockReviewStats({
        totalReviews: 0,
      });

      expect(isNewCard(stats)).toBe(true);
    });

    it('should return false for cards that have been reviewed', () => {
      const stats = createMockReviewStats({
        totalReviews: 1,
      });

      expect(isNewCard(stats)).toBe(false);
    });

    it('should return false for cards with multiple reviews', () => {
      const stats = createMockReviewStats({
        totalReviews: 10,
      });

      expect(isNewCard(stats)).toBe(false);
    });
  });

  describe('calculateRetentionRate', () => {
    it('should return 0 for cards with no reviews', () => {
      const stats = createMockReviewStats({
        totalReviews: 0,
        correctReviews: 0,
      });

      expect(calculateRetentionRate(stats)).toBe(0);
    });

    it('should calculate 100% retention rate for all correct reviews', () => {
      const stats = createMockReviewStats({
        totalReviews: 5,
        correctReviews: 5,
      });

      expect(calculateRetentionRate(stats)).toBe(100);
    });

    it('should calculate 0% retention rate for all wrong reviews', () => {
      const stats = createMockReviewStats({
        totalReviews: 3,
        correctReviews: 0,
      });

      expect(calculateRetentionRate(stats)).toBe(0);
    });

    it('should calculate partial retention rates correctly', () => {
      const stats = createMockReviewStats({
        totalReviews: 10,
        correctReviews: 7,
      });

      expect(calculateRetentionRate(stats)).toBe(70);
    });

    it('should handle fractional retention rates', () => {
      const stats = createMockReviewStats({
        totalReviews: 3,
        correctReviews: 1,
      });

      expect(calculateRetentionRate(stats)).toBeCloseTo(33.33, 2);
    });
  });

  describe('getIntervalDescription', () => {
    it('should return "1 day" for 1 day interval', () => {
      expect(getIntervalDescription(1)).toBe('1 day');
    });

    it('should return days for intervals less than a week', () => {
      expect(getIntervalDescription(2)).toBe('2 days');
      expect(getIntervalDescription(5)).toBe('5 days');
      expect(getIntervalDescription(6)).toBe('6 days');
    });

    it('should return "1 week" for 7 days', () => {
      expect(getIntervalDescription(7)).toBe('1 week');
    });

    it('should return weeks for intervals less than a month', () => {
      expect(getIntervalDescription(14)).toBe('2 weeks');
      expect(getIntervalDescription(21)).toBe('3 weeks');
      expect(getIntervalDescription(28)).toBe('4 weeks');
    });

    it('should return "1 month" for 30 days', () => {
      expect(getIntervalDescription(30)).toBe('1 month');
    });

    it('should return months for longer intervals', () => {
      expect(getIntervalDescription(60)).toBe('2 months');
      expect(getIntervalDescription(90)).toBe('3 months');
      expect(getIntervalDescription(180)).toBe('6 months');
    });

    it('should handle edge cases around week/month boundaries', () => {
      expect(getIntervalDescription(8)).toBe('1 week'); // Rounds to 1 week
      expect(getIntervalDescription(11)).toBe('2 weeks'); // Rounds to 2 weeks
      expect(getIntervalDescription(25)).toBe('4 weeks'); // Rounds to 4 weeks
      expect(getIntervalDescription(35)).toBe('1 month'); // Rounds to 1 month
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a complete learning progression correctly', () => {
      // Start with a new card
      let stats = createMockReviewStats();

      // First review - correct
      let result = calculateNextReview(stats, 'correct');
      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBe(2.5); // Capped at 2.5

      // Update stats for second review
      stats = { ...stats, ...result };

      // Second review - correct
      result = calculateNextReview(stats, 'correct');
      expect(result.repetitions).toBe(2);
      expect(result.intervalDays).toBe(6);
      expect(result.easinessFactor).toBe(2.5); // Still capped at 2.5

      // Update stats for third review
      stats = { ...stats, ...result };

      // Third review - wrong (should reset)
      result = calculateNextReview(stats, 'wrong');
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBeCloseTo(2.3, 10); // 2.5 - 0.2
    });

    it('should handle cards with very low easiness factors', () => {
      const stats = createMockReviewStats({
        easinessFactor: 1.3, // Minimum value
        intervalDays: 1,
        repetitions: 2,
      });

      const result = calculateNextReview(stats, 'correct');

      expect(result.repetitions).toBe(3);
      expect(result.intervalDays).toBe(Math.round(1 * 1.3)); // Should be 1
      expect(result.easinessFactor).toBeCloseTo(1.4, 10); // 1.3 + 0.1
    });
  });
});
