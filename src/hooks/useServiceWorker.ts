'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isRegistered: boolean;
  isInstalled: boolean;
  isWaiting: boolean;
  hasNewVersion: boolean;
  error: string | null;
}

export default function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isInstalled: false,
    isWaiting: false,
    hasNewVersion: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Skip service worker registration in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          error: null,
        }));

        if (registration.installing) {
          setState((prev) => ({ ...prev, isInstalled: false }));
        } else if (registration.waiting) {
          setState((prev) => ({
            ...prev,
            isWaiting: true,
            hasNewVersion: true,
          }));
        } else if (registration.active) {
          setState((prev) => ({ ...prev, isInstalled: true }));
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration!.installing;
          if (newWorker) {
            setState((prev) => ({ ...prev, isInstalled: false }));

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available
                  setState((prev) => ({
                    ...prev,
                    hasNewVersion: true,
                    isWaiting: true,
                  }));
                } else {
                  // Content is cached for offline use
                  setState((prev) => ({ ...prev, isInstalled: true }));
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Registration failed',
        }));
      }
    };

    // Handle messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setState((prev) => ({
          ...prev,
          hasNewVersion: true,
          isWaiting: true,
        }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Check if service worker is already controlled by a service worker
    if (navigator.serviceWorker.controller) {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const updateServiceWorker = () => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  return {
    ...state,
    updateServiceWorker,
  };
}
