'use client';

import { RefreshCw } from 'lucide-react';
import useServiceWorker from '@/hooks/useServiceWorker';

export default function UpdateBanner() {
  const { hasNewVersion, updateServiceWorker } = useServiceWorker();

  if (!hasNewVersion) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">New version available</p>
            <p className="text-xs opacity-90">
              Update to get the latest features and improvements
            </p>
          </div>
          <button
            onClick={handleUpdate}
            className="flex-shrink-0 bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
