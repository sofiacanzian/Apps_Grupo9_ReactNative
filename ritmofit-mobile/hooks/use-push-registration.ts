import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuthStore } from '../src/store/authStore';
import { getExpoPushTokenAsync } from '../src/services/notificationService';
import { registerPushToken } from '../src/services/userService';

export const usePushRegistration = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    let isMounted = true;

    const syncToken = async () => {
        if (!isAuthenticated) return;
        if (Constants?.appOwnership === 'expo') return; // Expo Go no soporta push, evita bloqueos

      const expoToken = await getExpoPushTokenAsync();
      if (!expoToken || !isMounted) return;

      try {
        await registerPushToken(expoToken);
      } catch (error) {
        console.warn('No se pudo registrar el token push:', error?.message || error);
      }
    };

    syncToken();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);
};
