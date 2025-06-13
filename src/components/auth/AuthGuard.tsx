'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthStore,
  useIsAuthenticated,
  useAuthInitialized,
} from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const { initialize } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
