'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { ReviewStatistics } from '@/components/review/ReviewStatistics';
import { useReviewStore, useReviewStatistics } from '@/store/reviewStore';

export default function ReviewPage() {
  const { loadStatistics, loadReviewQueue } = useReviewStore();
  const statistics = useReviewStatistics();

  // Load statistics on mount
  React.useEffect(() => {
    loadStatistics();
    loadReviewQueue();
  }, [loadStatistics, loadReviewQueue]);

  return (
    <AuthGuard>
      <MainLayout>
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-6">
                  <Image
                    src="/teal_duck_logo.png"
                    alt="Teal Duck Logo"
                    width={64}
                    height={64}
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Spaced Repetition Review
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Review your notecards using scientifically-proven spaced
                  repetition to maximize your learning and retention.
                </p>
              </div>

              {/* Review Statistics Dashboard */}
              <ReviewStatistics />

              {/* Quick Actions */}
              {statistics && statistics.totalCards > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Start Reviewing
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {statistics.dueCards > 0 || statistics.newCards > 0 ? (
                      <Link
                        href="/review/session"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <span className="mr-2">🧠</span>
                        Start Review Session
                        <span className="ml-2 text-sm opacity-80">
                          ({statistics.dueCards + statistics.newCards} cards)
                        </span>
                      </Link>
                    ) : (
                      <div className="text-center py-8 w-full">
                        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                          🎉
                        </div>
                        <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                          All Caught Up!
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          No cards are due for review right now. Great job
                          staying on top of your studies!
                        </p>
                        <Link
                          href="/notecards"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Create More Cards
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Getting Started */}
              {(!statistics || statistics.totalCards === 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                    📝
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Get Started with Spaced Repetition
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                    Create your first notecards to begin your spaced repetition
                    journey. The system will automatically schedule reviews
                    based on how well you know each card.
                  </p>
                  <Link
                    href="/notecards"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">➕</span>
                    Create Your First Notecard
                  </Link>
                </div>
              )}

              {/* How It Works */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  How Spaced Repetition Works
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📚</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Study Cards
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Review cards and rate your performance as correct or wrong
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🧮</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Smart Scheduling
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cards you know well appear less often, difficult cards
                      more frequently
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Maximize Retention
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Review just before you would forget, optimizing long-term
                      memory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
