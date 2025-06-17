import { useState, useEffect } from 'react';
import { networkMonitor } from '@/lib/sync/NetworkMonitor';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(networkMonitor.isOnline);

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return isOnline;
};
