'use client';

import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import usePWAInstallStatus from '@/hooks/usePWAInstallStatus';

export default function PWADebugInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pwaStatus = usePWAInstallStatus();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            <span className="text-sm font-medium">PWA Debug</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 py-3 border-t border-gray-700 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Installed:</span>
                <span
                  className={`ml-2 font-mono ${pwaStatus.isInstalled ? 'text-green-400' : 'text-red-400'}`}
                >
                  {pwaStatus.isInstalled ? 'YES' : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Standalone:</span>
                <span
                  className={`ml-2 font-mono ${pwaStatus.isStandalone ? 'text-green-400' : 'text-red-400'}`}
                >
                  {pwaStatus.isStandalone ? 'YES' : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Can Install:</span>
                <span
                  className={`ml-2 font-mono ${pwaStatus.canInstall ? 'text-green-400' : 'text-red-400'}`}
                >
                  {pwaStatus.canInstall ? 'YES' : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Platform:</span>
                <span className="ml-2 font-mono text-blue-400 capitalize">
                  {pwaStatus.platform}
                </span>
              </div>
            </div>

            {pwaStatus.installMethod && (
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-400 text-xs">Install Method:</span>
                <span className="ml-2 font-mono text-purple-400 text-xs capitalize">
                  {pwaStatus.installMethod}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
              <div>
                Display Mode:{' '}
                <span className="font-mono">
                  {window.matchMedia('(display-mode: standalone)').matches
                    ? 'standalone'
                    : window.matchMedia('(display-mode: minimal-ui)').matches
                      ? 'minimal-ui'
                      : window.matchMedia('(display-mode: fullscreen)').matches
                        ? 'fullscreen'
                        : 'browser'}
                </span>
              </div>
              <div>
                User Agent:{' '}
                <span className="font-mono truncate">
                  {navigator.userAgent.slice(0, 40)}...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
