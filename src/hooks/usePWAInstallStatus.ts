'use client';

import { useEffect, useState } from 'react';

interface PWAInstallStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  installMethod: 'browser' | 'homescreen' | 'unknown' | null;
  platform: string;
}

interface RelatedApp {
  platform: string;
  url?: string;
  id?: string;
}

declare global {
  interface Navigator {
    getInstalledRelatedApps?: () => Promise<RelatedApp[]>;
    standalone?: boolean;
  }
}

export default function usePWAInstallStatus() {
  const [status, setStatus] = useState<PWAInstallStatus>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    installMethod: null,
    platform: 'unknown',
  });

  useEffect(() => {
    const detectInstallationStatus = async () => {
      // Method 1: Check if running in standalone mode
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;

      // Method 2: Check if launched from home screen (iOS)
      const isHomeScreen = window.navigator.standalone === true;

      // Method 3: Check if app was installed via browser
      const isMinimalUI = window.matchMedia(
        '(display-mode: minimal-ui)'
      ).matches;

      // Determine installation status
      const isInstalled = isStandalone || isHomeScreen || isMinimalUI;

      // Determine installation method
      let installMethod: PWAInstallStatus['installMethod'] = null;
      if (isStandalone) installMethod = 'browser';
      else if (isHomeScreen) installMethod = 'homescreen';
      else if (isMinimalUI) installMethod = 'browser';

      // Detect platform
      let platform = 'unknown';
      if (
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad')
      ) {
        platform = 'ios';
      } else if (navigator.userAgent.includes('Android')) {
        platform = 'android';
      } else if (navigator.userAgent.includes('Windows')) {
        platform = 'windows';
      } else if (navigator.userAgent.includes('Mac')) {
        platform = 'macos';
      } else if (navigator.userAgent.includes('Linux')) {
        platform = 'linux';
      }

      // Method 4: Check for related installed apps (Chrome only)
      let hasRelatedApps = false;
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps!();
          hasRelatedApps = relatedApps.length > 0;
          console.debug('getInstalledRelatedApps result:', relatedApps);
        } catch (error) {
          // Feature not supported or permission denied
          console.debug('getInstalledRelatedApps not available:', error);
        }
      }

      // Method 5: Check localStorage for previous installation
      const wasInstalledBefore =
        localStorage.getItem('pwa-was-installed') === 'true';

      setStatus({
        isInstalled: isInstalled || hasRelatedApps || wasInstalledBefore,
        isStandalone,
        canInstall: false, // Will be updated by beforeinstallprompt event
        installMethod,
        platform,
      });
    };

    // Handle install prompt availability
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setStatus((prev) => ({
        ...prev,
        canInstall: true,
      }));
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      // Remember that the app was installed
      localStorage.setItem('pwa-was-installed', 'true');

      setStatus((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        installMethod: 'browser',
      }));
    };

    // Detect display mode changes (if user installs/uninstalls)
    const handleDisplayModeChange = () => {
      detectInstallationStatus();
    };

    // Set up event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    // Initial detection
    detectInstallationStatus();

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  return status;
}
