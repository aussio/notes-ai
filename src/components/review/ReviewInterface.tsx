'use client';

import React, { useEffect, useCallback, useState } from 'react';
import {
  useReviewStore,
  useCurrentReviewCard,
  useReviewProgress,
} from '@/store/reviewStore';
import { useNotecardsStore } from '@/store/notecardsStore';
import type { ReviewResult } from '@/types';

export const ReviewInterface: React.FC = () => {
  const {
    loadReviewQueue,
    startReviewSession,
    submitReview,
    showCardAnswer,
    endReviewSession,
    loadStatistics,
    clearError,
    isLoading,
    isReviewing,
    showAnswer,
    error,
    reviewQueue,
    currentCardIndex,
  } = useReviewStore();

  const { notecards, loadNotecards, isLoading: notecardsLoading, deleteNotecard } = useNotecardsStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentCard = useCurrentReviewCard();
  const progress = useReviewProgress();

  // Load notecards first, then review queue and statistics, then auto-start session
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure notecards are loaded first
        if (notecards.length === 0 && !notecardsLoading) {
          await loadNotecards();
        }
        
        // Only load review queue after notecards are available
        if (notecards.length > 0) {
          await loadReviewQueue();
          await loadStatistics();
        }
      } catch (error) {
        console.error('Failed to load review data:', error);
      }
    };

    loadData();
  }, [loadNotecards, loadReviewQueue, loadStatistics, notecards.length, notecardsLoading]);

  // Auto-start review session when cards are ready
  useEffect(() => {
    if (!isReviewing && currentCard && progress.total > 0 && !isLoading) {
      startReviewSession();
    }
  }, [isReviewing, currentCard, progress.total, isLoading, startReviewSession]);

  // Keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!isReviewing || !currentCard) return;

      switch (event.key) {
        case ' ':
        case 'Enter':
          if (!showAnswer) {
            showCardAnswer();
          } else {
            // Space/Enter for correct when answer is shown
            submitReview('correct');
          }
          break;
        case '1':
        case 'a':
        case 'ArrowLeft':
          if (showAnswer) {
            submitReview('wrong');
          }
          break;
        case '0':
        case 'Delete':
        case 'ArrowRight':
          if (showAnswer) {
            submitReview('correct');
          }
          break;
        case 'Escape':
          endReviewSession();
          break;
        case 'd':
        case 'D':
          if (showAnswer) {
            setShowDeleteConfirm(true);
          }
          break;
      }
    },
    [
      isReviewing,
      currentCard,
      showAnswer,
      showCardAnswer,
      submitReview,
      endReviewSession,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleStartReview = async () => {
    await startReviewSession();
  };

  const handleSubmitReview = async (result: ReviewResult) => {
    await submitReview(result);
  };

  const handleShowAnswer = () => {
    showCardAnswer();
  };

  const handleDeleteCard = async () => {
    if (!currentCard) return;
    
    try {
      // Delete the notecard
      await deleteNotecard(currentCard.notecard.id);
      
      // Remove from review queue manually and move to next card
      const updatedQueue = reviewQueue.filter((_, index) => index !== currentCardIndex);
      
      // If no more cards, end the session
      if (updatedQueue.length === 0) {
        endReviewSession();
      } else {
        // Reload the review queue to reflect the deletion
        await loadReviewQueue();
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete card:', error);
      // Could show an error message here
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Review Error
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading while either notecards or review queue is loading
  if (isLoading || notecardsLoading || (notecards.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading review session...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {notecardsLoading ? 'Loading notecards...' : 'Setting up review queue...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isReviewing && (!currentCard || progress.total === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Cards to Review
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {notecards.length === 0 
                ? 'Create some notecards to get started with spaced repetition learning!'
                : 'Great job! You have no cards due for review right now. Come back later or create more notecards to practice.'
              }
            </p>
            <button
              onClick={() => window.location.href = '/notecards'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {notecards.length === 0 ? 'Create First Notecard' : 'Go to Notecards'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isReviewing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Review
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have {progress.total} cards ready for review.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleStartReview}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Start Review Session
              </button>
              <button
                onClick={() => window.location.href = '/review'}
                className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Back to Review Dashboard
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Keyboard Shortcuts
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                •{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  Space
                </kbd>{' '}
                /{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  Enter
                </kbd>{' '}
                - Show answer / Mark correct
              </div>
              <div>
                •{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  1
                </kbd>{' '}
                /{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  ←
                </kbd>{' '}
                - Mark wrong
              </div>
              <div>
                •{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  0
                </kbd>{' '}
                /{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  →
                </kbd>{' '}
                - Mark correct
              </div>
              <div>
                •{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  D
                </kbd>{' '}
                - Delete card
              </div>
              <div>
                •{' '}
                <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                  Esc
                </kbd>{' '}
                - End session
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Review Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Great job! You&apos;ve finished reviewing all cards in your queue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Review More Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Card {progress.current} of {progress.total}
              </span>
              <div className="flex items-center space-x-4">
                {showAnswer && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    title="Delete this card (D)"
                  >
                    🗑️ Delete
                  </button>
                )}
                <button
                  onClick={endReviewSession}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  End Session
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card display */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Front of card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                  {currentCard.notecard.front}
                </div>
              </div>
            </div>

            {/* Answer section */}
            {showAnswer && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 mb-6 min-h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Answer:
                  </div>
                  <div className="text-lg text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                    {currentCard.notecard.back}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center space-x-4">
              {!showAnswer ? (
                <button
                  onClick={handleShowAnswer}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Show Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSubmitReview('wrong')}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Wrong (1)
                  </button>
                  <button
                    onClick={() => handleSubmitReview('correct')}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Correct (0)
                  </button>
                </>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              {!showAnswer
                ? 'Press Space or Enter to show answer'
                : 'Press 1/← for Wrong, 0/→ for Correct, or Space/Enter for Correct'}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Card?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this card? This action cannot be undone.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <strong>Front:</strong> {currentCard.notecard.front}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCard}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
