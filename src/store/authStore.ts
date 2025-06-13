import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Initialize auth state by checking current session
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Get current session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            set({
              error: error.message,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          set({
            session,
            user: session?.user || null,
            isLoading: false,
            isInitialized: true,
          });

          // Listen for auth changes
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            set({
              session,
              user: session?.user || null,
              error: null,
            });
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to initialize auth',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      // Sign out user
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error('Error signing out:', error);
            set({ error: error.message, isLoading: false });
            return;
          }

          set({
            user: null,
            session: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error during sign out:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to sign out',
            isLoading: false,
          });
        }
      },

      // Clear error state
      clearError: () => set({ error: null }),
    })),
    { name: 'auth-store' }
  )
);

// Selectors for easy consumption
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthInitialized = () =>
  useAuthStore((state) => state.isInitialized);
export const useAuthError = () => useAuthStore((state) => state.error);
