import { useEffect } from 'react';
import Constants from 'expo-constants';
import { requestNotificationPermission } from '../src/services/notificationService';

export const useNotificationsSetup = () => {
  useEffect(() => {
    if (Constants?.appOwnership === 'expo') {
      return;
    }

    requestNotificationPermission();
  }, []);
};
