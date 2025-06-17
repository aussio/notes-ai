'use client';

import { useSyncStatus } from '@/store/syncStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Cloud, Loader2, WifiOff } from 'lucide-react';

export function SyncStatus() {
  const syncStatus = useSyncStatus();
  const isOnline = useNetworkStatus();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }

    if (syncStatus.isSyncing) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }

    if (syncStatus.queueLength > 0) {
      return <Cloud className="h-4 w-4 text-yellow-500" />;
    }

    return <Cloud className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }

    if (syncStatus.queueLength > 0) {
      return `${syncStatus.queueLength} pending`;
    }

    if (syncStatus.lastSyncTime) {
      const timeSince = Date.now() - syncStatus.lastSyncTime.getTime();
      const minutes = Math.floor(timeSince / 60000);
      if (minutes < 1) {
        return 'Synced now';
      } else if (minutes < 60) {
        return `Synced ${minutes}m ago`;
      } else {
        const hours = Math.floor(minutes / 60);
        return `Synced ${hours}h ago`;
      }
    }

    return 'Ready to sync';
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}
