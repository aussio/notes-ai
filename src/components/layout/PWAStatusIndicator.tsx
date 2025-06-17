'use client';

import { Smartphone, Monitor, Tablet, CheckCircle } from 'lucide-react';
import usePWAInstallStatus from '@/hooks/usePWAInstallStatus';

export default function PWAStatusIndicator() {
  const { isInstalled, isStandalone, installMethod, platform } =
    usePWAInstallStatus();

  // Don't show anything if not installed
  if (!isInstalled) {
    return null;
  }

  // Get platform icon
  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="w-4 h-4" />;
      case 'windows':
      case 'macos':
      case 'linux':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Tablet className="w-4 h-4" />;
    }
  };

  // Get install method text
  const getInstallText = () => {
    if (isStandalone) {
      return 'Running as installed app';
    }

    switch (installMethod) {
      case 'browser':
        return 'Installed via browser';
      case 'homescreen':
        return 'Added to home screen';
      default:
        return 'Running as app';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      {getPlatformIcon()}
      <span className="text-green-800 dark:text-green-200 font-medium">
        {getInstallText()}
      </span>
      {platform !== 'unknown' && (
        <span className="text-green-600 dark:text-green-400 text-xs capitalize">
          ({platform})
        </span>
      )}
    </div>
  );
}
