/**
 * Spaced Repetition Database Layer
 * Handles review stats and sessions for both IndexedDB and Supabase
 */

import Dexie, { Table } from 'dexie';
import type {
  NotecardReviewStats,
  DatabaseNotecardReviewStats,
  ReviewSession,
  DatabaseReviewSession,
  ReviewCard,
  SpacedRepetitionDatabase,
} from '@/types';
import { notecardsDatabase } from '@/lib/database';
import { createInitialReviewStats } from './sm2-algorithm';

// Extend the existing database with spaced repetition tables
class SpacedRepetitionDB extends Dexie {
  notecardReviewStats!: Table<DatabaseNotecardReviewStats>;
  reviewSessions!: Table<DatabaseReviewSession>;

  constructor() {
    super('SpacedRepetitionDatabase');

    this.version(1).stores({
      notecardReviewStats:
        'id, notecard_id, user_id, next_review_date, [user_id+next_review_date], [notecard_id+user_id]',
      reviewSessions: 'id, user_id, start_time, [user_id+start_time]',
    });
  }
}

const spacedRepetitionDb = new SpacedRepetitionDB();

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Serialization functions
const serializeReviewStats = (
  stats: NotecardReviewStats
): DatabaseNotecardReviewStats => ({
  id: stats.id,
  notecard_id: stats.notecard_id,
  user_id: stats.user_id,
  easiness_factor: stats.easinessFactor,
  interval_days: stats.intervalDays,
  repetitions: stats.repetitions,
  next_review_date: stats.nextReviewDate.toISOString(),
  last_review_date: stats.lastReviewDate?.toISOString() || null,
  total_reviews: stats.totalReviews,
  correct_reviews: stats.correctReviews,
  created_at: stats.createdAt.toISOString(),
  updated_at: stats.updatedAt.toISOString(),
});

const deserializeReviewStats = (
  dbStats: DatabaseNotecardReviewStats
): NotecardReviewStats => ({
  id: dbStats.id,
  notecard_id: dbStats.notecard_id,
  user_id: dbStats.user_id,
  easinessFactor: dbStats.easiness_factor,
  intervalDays: dbStats.interval_days,
  repetitions: dbStats.repetitions,
  nextReviewDate: new Date(dbStats.next_review_date),
  lastReviewDate: dbStats.last_review_date
    ? new Date(dbStats.last_review_date)
    : null,
  totalReviews: dbStats.total_reviews,
  correctReviews: dbStats.correct_reviews,
  createdAt: new Date(dbStats.created_at),
  updatedAt: new Date(dbStats.updated_at),
});

const serializeReviewSession = (
  session: ReviewSession
): DatabaseReviewSession => ({
  id: session.id,
  user_id: session.user_id,
  start_time: session.startTime.toISOString(),
  end_time: session.endTime?.toISOString() || null,
  cards_reviewed: session.cardsReviewed,
  cards_correct: session.cardsCorrect,
  created_at: session.createdAt.toISOString(),
  updated_at: session.updatedAt.toISOString(),
});

const deserializeReviewSession = (
  dbSession: DatabaseReviewSession
): ReviewSession => ({
  id: dbSession.id,
  user_id: dbSession.user_id,
  startTime: new Date(dbSession.start_time),
  endTime: dbSession.end_time ? new Date(dbSession.end_time) : null,
  cardsReviewed: dbSession.cards_reviewed,
  cardsCorrect: dbSession.cards_correct,
  createdAt: new Date(dbSession.created_at),
  updatedAt: new Date(dbSession.updated_at),
});

// Test helper function (not part of the main interface)
export const cleanupTestData = async (userId: string): Promise<void> => {
  try {
    // Delete all review stats for the user
    await spacedRepetitionDb.notecardReviewStats
      .where('user_id')
      .equals(userId)
      .delete();

    // Delete all review sessions for the user
    await spacedRepetitionDb.reviewSessions
      .where('user_id')
      .equals(userId)
      .delete();
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
};

// Cascade cleanup function for notecard deletion
export const cleanupNotecardReviewStats = async (
  notecardId: string,
  userId: string
): Promise<void> => {
  try {
    // Delete review stats for the specific notecard
    await spacedRepetitionDb.notecardReviewStats
      .where({ notecard_id: notecardId, user_id: userId })
      .delete();
  } catch (error) {
    console.error('Failed to cleanup notecard review stats:', error);
    throw error;
  }
};

// Local IndexedDB implementation
export const spacedRepetitionDatabase: SpacedRepetitionDatabase = {
  // Review stats operations
  async getReviewStats(
    notecardId: string,
    userId: string
  ): Promise<NotecardReviewStats | undefined> {
    try {
      const dbStats = await spacedRepetitionDb.notecardReviewStats
        .where({ notecard_id: notecardId, user_id: userId })
        .first();
      return dbStats ? deserializeReviewStats(dbStats) : undefined;
    } catch (error) {
      console.error('Failed to get review stats:', error);
      throw new Error('Failed to load review stats');
    }
  },

  async getAllReviewStats(userId: string): Promise<NotecardReviewStats[]> {
    try {
      const dbStats = await spacedRepetitionDb.notecardReviewStats
        .where('user_id')
        .equals(userId)
        .toArray();
      return dbStats.map(deserializeReviewStats);
    } catch (error) {
      console.error('Failed to get all review stats:', error);
      throw new Error('Failed to load review stats');
    }
  },

  async createReviewStats(
    notecardId: string,
    userId: string
  ): Promise<NotecardReviewStats> {
    try {
      const now = new Date();
      const initialStats = createInitialReviewStats(notecardId, userId);
      const newStats: NotecardReviewStats = {
        id: generateId(),
        ...initialStats,
        createdAt: now,
        updatedAt: now,
      };

      const dbStats = serializeReviewStats(newStats);
      await spacedRepetitionDb.notecardReviewStats.add(dbStats);
      return newStats;
    } catch (error) {
      console.error('Failed to create review stats:', error);
      throw new Error('Failed to create review stats');
    }
  },

  async updateReviewStats(
    id: string,
    updates: Partial<NotecardReviewStats>
  ): Promise<NotecardReviewStats> {
    try {
      const existingDbStats =
        await spacedRepetitionDb.notecardReviewStats.get(id);
      if (!existingDbStats) {
        throw new Error('Review stats not found');
      }

      const existingStats = deserializeReviewStats(existingDbStats);
      const updatedStats: NotecardReviewStats = {
        ...existingStats,
        ...updates,
        updatedAt: new Date(),
      };

      const dbStats = serializeReviewStats(updatedStats);
      await spacedRepetitionDb.notecardReviewStats.update(id, dbStats);
      return updatedStats;
    } catch (error) {
      console.error('Failed to update review stats:', error);
      throw new Error('Failed to update review stats');
    }
  },

  // Review queue operations
  async getDueCards(userId: string, limit = 50): Promise<ReviewCard[]> {
    try {
      const now = new Date();
      const dueStats = await spacedRepetitionDb.notecardReviewStats
        .where(['user_id', 'next_review_date'])
        .between([userId, new Date(0)], [userId, now], true, true)
        .limit(limit)
        .toArray();

      const reviewCards: ReviewCard[] = [];
      for (const dbStats of dueStats) {
        const notecard = await notecardsDatabase.getNotecardById(
          dbStats.notecard_id,
          userId
        );
        if (notecard) {
          reviewCards.push({
            notecard,
            reviewStats: deserializeReviewStats(dbStats),
          });
        }
      }
      return reviewCards;
    } catch (error) {
      console.error('Failed to get due cards:', error);
      throw new Error('Failed to load due cards');
    }
  },

  async getNewCards(userId: string, limit = 20): Promise<ReviewCard[]> {
    try {
      // Get all notecards for the user
      const allNotecards = await notecardsDatabase.getAllNotecards(userId);

      // Get all existing review stats
      const existingStats = await spacedRepetitionDb.notecardReviewStats
        .where('user_id')
        .equals(userId)
        .toArray();

      const existingNotecardIds = new Set(
        existingStats.map((s) => s.notecard_id)
      );

      // Find notecards without review stats (new cards)
      const newNotecards = allNotecards.filter(
        (notecard) => !existingNotecardIds.has(notecard.id)
      );

      // Return new cards with temporary review stats (don't save to database yet)
      const newCards: ReviewCard[] = [];
      for (const notecard of newNotecards.slice(0, limit)) {
        // Create temporary review stats without saving to database
        const now = new Date();
        const tempReviewStats: NotecardReviewStats = {
          id: generateId(),
          notecard_id: notecard.id,
          user_id: userId,
          easinessFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          nextReviewDate: now,
          lastReviewDate: null,
          totalReviews: 0,
          correctReviews: 0,
          createdAt: now,
          updatedAt: now,
        };
        newCards.push({ notecard, reviewStats: tempReviewStats });
      }

      return newCards;
    } catch (error) {
      console.error('Failed to get new cards:', error);
      throw new Error('Failed to load new cards');
    }
  },

  // Review session operations
  async createReviewSession(userId: string): Promise<ReviewSession> {
    try {
      const now = new Date();
      const newSession: ReviewSession = {
        id: generateId(),
        user_id: userId,
        startTime: now,
        endTime: null,
        cardsReviewed: 0,
        cardsCorrect: 0,
        createdAt: now,
        updatedAt: now,
      };

      const dbSession = serializeReviewSession(newSession);
      await spacedRepetitionDb.reviewSessions.add(dbSession);
      return newSession;
    } catch (error) {
      console.error('Failed to create review session:', error);
      throw new Error('Failed to create review session');
    }
  },

  async updateReviewSession(
    id: string,
    updates: Partial<ReviewSession>
  ): Promise<ReviewSession> {
    try {
      const existingDbSession = await spacedRepetitionDb.reviewSessions.get(id);
      if (!existingDbSession) {
        throw new Error('Review session not found');
      }

      const existingSession = deserializeReviewSession(existingDbSession);
      const updatedSession: ReviewSession = {
        ...existingSession,
        ...updates,
        updatedAt: new Date(),
      };

      const dbSession = serializeReviewSession(updatedSession);
      await spacedRepetitionDb.reviewSessions.update(id, dbSession);
      return updatedSession;
    } catch (error) {
      console.error('Failed to update review session:', error);
      throw new Error('Failed to update review session');
    }
  },

  async getReviewSessions(
    userId: string,
    limit = 10
  ): Promise<ReviewSession[]> {
    try {
      const dbSessions = await spacedRepetitionDb.reviewSessions
        .where('user_id')
        .equals(userId)
        .reverse()
        .limit(limit)
        .toArray();

      // Sort by start_time descending (most recent first)
      const sortedSessions = dbSessions.sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

      return sortedSessions.map(deserializeReviewSession);
    } catch (error) {
      console.error('Failed to get review sessions:', error);
      throw new Error('Failed to load review sessions');
    }
  },

  // Statistics
  async getReviewStatistics(userId: string): Promise<{
    totalCards: number;
    dueCards: number;
    newCards: number;
    retentionRate: number;
  }> {
    try {
      const allNotecards = await notecardsDatabase.getAllNotecards(userId);
      const totalCards = allNotecards.length;

      const allStats = await spacedRepetitionDb.notecardReviewStats
        .where('user_id')
        .equals(userId)
        .toArray();

      const now = new Date();
      const dueCards = allStats.filter(
        (stats) => new Date(stats.next_review_date) <= now
      ).length;

      const newCards = totalCards - allStats.length;

      // Calculate overall retention rate
      const totalReviews = allStats.reduce(
        (sum, stats) => sum + stats.total_reviews,
        0
      );
      const correctReviews = allStats.reduce(
        (sum, stats) => sum + stats.correct_reviews,
        0
      );
      const retentionRate =
        totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

      return {
        totalCards,
        dueCards,
        newCards,
        retentionRate,
      };
    } catch (error) {
      console.error('Failed to get review statistics:', error);
      throw new Error('Failed to load review statistics');
    }
  },
};
