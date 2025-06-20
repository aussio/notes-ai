import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { useMemo } from 'react';
import type { ReviewCard, ReviewSession, ReviewResult } from '@/types';
import { spacedRepetitionDatabase } from '@/lib/spaced-repetition/database';
import { calculateNextReview } from '@/lib/spaced-repetition/sm2-algorithm';
import { useAuthStore } from '@/store/authStore';

interface ReviewState {
  // Current review session state
  currentSession: ReviewSession | null;
  reviewQueue: ReviewCard[];
  currentCardIndex: number;
  currentCard: ReviewCard | null;

  // Review statistics and progress
  statistics: {
    totalCards: number;
    dueCards: number;
    newCards: number;
    retentionRate: number;
  } | null;

  // UI state
  isLoading: boolean;
  isReviewing: boolean;
  showAnswer: boolean;
  error: string | null;

  // Actions
  loadReviewQueue: () => Promise<void>;
  startReviewSession: () => Promise<void>;
  submitReview: (result: ReviewResult) => Promise<void>;
  showCardAnswer: () => void;
  nextCard: () => void;
  endReviewSession: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  clearError: () => void;

  // Navigation
  goToCard: (index: number) => void;
  resetReview: () => void;
}

export const useReviewStore = create<ReviewState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentSession: null,
      reviewQueue: [],
      currentCardIndex: 0,
      currentCard: null,
      statistics: null,
      isLoading: false,
      isReviewing: false,
      showAnswer: false,
      error: null,

      // Load the review queue (due cards + some new cards)
      loadReviewQueue: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Load due cards first, then new cards to fill the queue
          const dueCards = await spacedRepetitionDatabase.getDueCards(
            user.id,
            50
          );
          const newCards = await spacedRepetitionDatabase.getNewCards(
            user.id,
            Math.max(0, 20 - dueCards.length)
          );

          const reviewQueue = [...dueCards, ...newCards];

          set({
            reviewQueue,
            currentCardIndex: 0,
            currentCard: reviewQueue.length > 0 ? reviewQueue[0] : null,
            showAnswer: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load review queue:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load review queue',
            isLoading: false,
          });
        }
      },

      // Start a new review session
      startReviewSession: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'User not authenticated' });
          return;
        }

        try {
          const session = await spacedRepetitionDatabase.createReviewSession(
            user.id
          );
          set({
            currentSession: session,
            isReviewing: true,
            showAnswer: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to start review session:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to start review session',
          });
        }
      },

      // Submit a review result and update the card
      submitReview: async (result: ReviewResult) => {
        const { currentCard, currentSession, reviewQueue, currentCardIndex } =
          get();

        if (!currentCard || !currentSession) {
          set({ error: 'No active review session or card' });
          return;
        }

        try {
          // Calculate next review parameters using SM-2 algorithm
          const nextReviewParams = calculateNextReview(
            currentCard.reviewStats,
            result
          );

          // Check if this is a new card (review stats not yet saved to database)
          const isNewCard =
            currentCard.reviewStats.totalReviews === 0 &&
            currentCard.reviewStats.lastReviewDate === null;

          let updatedStats;
          if (isNewCard) {
            // Create review stats for new card
            updatedStats = await spacedRepetitionDatabase.createReviewStats(
              currentCard.notecard.id,
              currentCard.reviewStats.user_id
            );
            // Update with the review result
            updatedStats = await spacedRepetitionDatabase.updateReviewStats(
              updatedStats.id,
              {
                ...nextReviewParams,
                lastReviewDate: new Date(),
                totalReviews: 1,
                correctReviews: result === 'correct' ? 1 : 0,
              }
            );
          } else {
            // Update existing review stats
            updatedStats = await spacedRepetitionDatabase.updateReviewStats(
              currentCard.reviewStats.id,
              {
                ...nextReviewParams,
                lastReviewDate: new Date(),
                totalReviews: currentCard.reviewStats.totalReviews + 1,
                correctReviews:
                  currentCard.reviewStats.correctReviews +
                  (result === 'correct' ? 1 : 0),
              }
            );
          }

          // Update session stats
          const updatedSession =
            await spacedRepetitionDatabase.updateReviewSession(
              currentSession.id,
              {
                cardsReviewed: currentSession.cardsReviewed + 1,
                cardsCorrect:
                  currentSession.cardsCorrect + (result === 'correct' ? 1 : 0),
              }
            );

          // Update the card in the queue with new stats
          const updatedQueue = [...reviewQueue];
          updatedQueue[currentCardIndex] = {
            ...currentCard,
            reviewStats: updatedStats,
          };

          set({
            currentSession: updatedSession,
            reviewQueue: updatedQueue,
            showAnswer: false,
          });

          // Automatically move to next card
          get().nextCard();
        } catch (error) {
          console.error('Failed to submit review:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to submit review',
          });
        }
      },

      // Show the answer for the current card
      showCardAnswer: () => {
        set({ showAnswer: true });
      },

      // Move to the next card
      nextCard: () => {
        const { reviewQueue, currentCardIndex } = get();
        const nextIndex = currentCardIndex + 1;

        if (nextIndex < reviewQueue.length) {
          set({
            currentCardIndex: nextIndex,
            currentCard: reviewQueue[nextIndex],
            showAnswer: false,
          });
        } else {
          // End of queue - end the session
          get().endReviewSession();
        }
      },

      // End the current review session
      endReviewSession: async () => {
        const { currentSession } = get();

        if (currentSession) {
          try {
            await spacedRepetitionDatabase.updateReviewSession(
              currentSession.id,
              {
                endTime: new Date(),
              }
            );
          } catch (error) {
            console.error('Failed to end review session:', error);
          }
        }

        set({
          currentSession: null,
          isReviewing: false,
          currentCardIndex: 0,
          currentCard: null,
          showAnswer: false,
        });

        // Reload statistics after session ends
        await get().loadStatistics();
      },

      // Load review statistics
      loadStatistics: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const statistics = await spacedRepetitionDatabase.getReviewStatistics(
            user.id
          );
          set({ statistics });
        } catch (error) {
          console.error('Failed to load statistics:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load statistics',
          });
        }
      },

      // Clear error state
      clearError: () => set({ error: null }),

      // Navigate to a specific card
      goToCard: (index: number) => {
        const { reviewQueue } = get();
        if (index >= 0 && index < reviewQueue.length) {
          set({
            currentCardIndex: index,
            currentCard: reviewQueue[index],
            showAnswer: false,
          });
        }
      },

      // Reset the review state
      resetReview: () => {
        set({
          currentSession: null,
          reviewQueue: [],
          currentCardIndex: 0,
          currentCard: null,
          isReviewing: false,
          showAnswer: false,
          error: null,
        });
      },
    })),
    { name: 'review-store' }
  )
);

// Set up auth state subscription to clear review data when user logs out
useAuthStore.subscribe(
  (state) => ({ user: state.user }),
  (authState, prevAuthState) => {
    // If user logged out, clear review state
    if (prevAuthState.user && !authState.user) {
      useReviewStore.getState().resetReview();
    }
  }
);

// Selectors for easier consumption
export const useCurrentReviewCard = () =>
  useReviewStore((state) => state.currentCard);
export const useReviewProgress = () => {
  const currentCardIndex = useReviewStore((state) => state.currentCardIndex);
  const reviewQueueLength = useReviewStore((state) => state.reviewQueue.length);

  return useMemo(() => {
    const current = currentCardIndex + 1;
    const total = reviewQueueLength;
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return { current, total, percentage };
  }, [currentCardIndex, reviewQueueLength]);
};
export const useReviewStatistics = () =>
  useReviewStore((state) => state.statistics);
export const useIsReviewing = () =>
  useReviewStore((state) => state.isReviewing);
