'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';

export const useDesignSync = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { syncDesigns, pendingSyncs, lastSyncTime } = useDesignStore();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAuthStateRef = useRef(isAuthenticated);

  // Sync when user logs in
  useEffect(() => {
    const wasAuthenticated = lastAuthStateRef.current;
    lastAuthStateRef.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated) {
      // User just logged in, trigger sync
      console.log('User logged in, triggering design sync...');
      syncDesigns().catch(error => {
        console.error('Failed to sync designs on login:', error);
      });
    }
  }, [isAuthenticated, syncDesigns]);

  // Set up periodic sync for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Set up periodic sync every 30 seconds if there are pending syncs
      syncIntervalRef.current = setInterval(() => {
        if (pendingSyncs.size > 0) {
          console.log('Periodic sync triggered, pending syncs:', pendingSyncs.size);
          syncDesigns().catch(error => {
            console.error('Periodic sync failed:', error);
          });
        }
      }, 30000); // 30 seconds

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    } else {
      // Clear interval when user logs out
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }
  }, [isAuthenticated, pendingSyncs.size, syncDesigns]);

  // Sync on page visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && pendingSyncs.size > 0) {
        console.log('Page became visible, triggering sync...');
        syncDesigns().catch(error => {
          console.error('Visibility sync failed:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, pendingSyncs.size, syncDesigns]);

  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && pendingSyncs.size > 0) {
        // Use sendBeacon for reliable sync on page unload
        // Note: This is a simplified approach, in production you might want
        // to use a more sophisticated queuing mechanism
        console.log('Page unloading, attempting final sync...');
        syncDesigns().catch(error => {
          console.error('Unload sync failed:', error);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, pendingSyncs.size, syncDesigns]);

  return {
    isAuthenticated,
    pendingSyncsCount: pendingSyncs.size,
    lastSyncTime,
    manualSync: syncDesigns
  };
};
