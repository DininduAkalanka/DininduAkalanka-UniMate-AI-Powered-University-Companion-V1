/**
 * App Initialization with Smart Notifications
 * Hook to initialize notification system on app start
 */

import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getCurrentUser } from '../services/authService';
import { initializeBackgroundNotifications } from '../services/backgroundNotifications';
import { initializeNotifications } from '../services/smartNotificationService';

/**
 * Custom hook to initialize smart notifications
 */
export function useNotificationInitialization() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSystem();

    // Re-check when app comes to foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeSystem = async () => {
    try {
      console.log('[App Init] Initializing smart notification system...');

      const user = await getCurrentUser();
      if (!user) {
        console.log('[App Init] No user logged in, skipping initialization');
        return;
      }

      // Initialize foreground notifications
      const foregroundInit = await initializeNotifications(user.id);
      if (!foregroundInit) {
        throw new Error('Failed to initialize foreground notifications');
      }

      // Initialize background notifications
      const backgroundInit = await initializeBackgroundNotifications(user.id);
      if (!backgroundInit) {
        console.warn('[App Init] Background notifications initialization failed');
      }

      setInitialized(true);
      console.log('[App Init] Smart notifications initialized successfully ✅');
    } catch (err) {
      console.error('[App Init] Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && !initialized) {
      // Try to initialize again when app becomes active
      await initializeSystem();
    }
  };

  return { initialized, error };
}

export default useNotificationInitialization;
