'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Initialize the auth store to process the callback
        const { initialize } = useAuthStore.getState();
        await initialize();

        // Wait a moment for the auth state to stabilize
        setTimeout(() => {
          const { user } = useAuthStore.getState();

          if (user) {
            // User is logged in, redirect to home
            router.push('/');
          } else {
            // No session, redirect to auth
            router.push('/auth');
          }
        }, 100);
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
