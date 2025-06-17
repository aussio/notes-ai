'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Zap, WifiOff, X } from 'lucide-react';
import usePWAInstallStatus from '@/hooks/usePWAInstallStatus';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const { isInstalled, canInstall } = usePWAInstallStatus();

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // User accepted the install prompt
      } else {
        // User dismissed the install prompt
      }
    } catch (error) {
      console.error('Error during installation:', error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't show if already installed, can't install, or dismissed
  if (isInstalled || !canInstall || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Install Teal Notes</h3>
              <p className="text-sm text-blue-100">
                Get the full app experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss install banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-sm">Lightning fast</span>
          </div>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-green-300" />
            <span className="text-sm">Works offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-300" />
            <span className="text-sm">No app store needed</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            Maybe later
          </button>
        </div>

        <p className="text-xs text-blue-100 mt-3 text-center">
          Install to your home screen for quick access and offline use
        </p>
      </div>
    </div>
  );
}
