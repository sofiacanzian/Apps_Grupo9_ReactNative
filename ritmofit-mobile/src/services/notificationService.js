import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const AndroidImportance = Notifications.AndroidImportance ?? Notifications.AndroidImportanceDefault;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowAlert: true,
    }),
});

let permissionRequested = false;

const isPermissionGranted = (permissionResult) => {
    if (!permissionResult) return false;
    const normalizedStatus =
        permissionResult.status ??
        permissionResult.ios?.status ??
        permissionResult.android?.status ??
        permissionResult.expires;

    if (typeof normalizedStatus === 'string') {
        return normalizedStatus.toLowerCase() === 'granted';
    }

    const grantedConstant = Notifications.AuthorizationStatus?.GRANTED;
    if (typeof normalizedStatus === 'number' && grantedConstant !== undefined) {
        return normalizedStatus === grantedConstant;
    }

    return Boolean(permissionResult.granted);
};

export const requestNotificationPermission = async () => {
    try {
        if (permissionRequested) {
            const current = await Notifications.getPermissionsAsync();
            return isPermissionGranted(current);
        }

        permissionRequested = true;
        const existing = await Notifications.getPermissionsAsync();
        if (isPermissionGranted(existing)) {
            return true;
        }
        const response = await Notifications.requestPermissionsAsync();
        return isPermissionGranted(response);
    } catch (error) {
        console.warn('Notificaciones locales deshabilitadas:', error?.message || error);
        return false;
    }
};

const ensureAndroidChannel = async () => {
    if (Platform.OS !== 'android' || !Notifications.setNotificationChannelAsync) return;
    await Notifications.setNotificationChannelAsync('clases', {
        name: 'Recordatorios de clases',
        importance: AndroidImportance ?? Notifications.AndroidImportance?.DEFAULT,
        sound: 'default',
        vibrationPattern: [250, 250, 250, 250],
        lightColor: '#3b82f6',
    });
};

const buildStartDate = (clase) => {
    if (!clase?.fecha || !clase?.hora_inicio) return null;
    const date = new Date(`${clase.fecha}T${clase.hora_inicio}`);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const scheduleReservationReminders = async (reservas, minutesBefore = 60) => {
    if (!Array.isArray(reservas)) {
        return;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        return;
    }

    await ensureAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const reminders = reservas.map((reserva) => {
        const clase = reserva.Clase ?? reserva.clase ?? {};
        const start = buildStartDate(clase);
        if (!start) return null;
        const triggerDate = new Date(start.getTime() - minutesBefore * 60000);
        if (triggerDate <= now) return null;

        return Notifications.scheduleNotificationAsync({
            content: {
                title: `Clase ${clase.nombre || 'RitmoFit'} en ${minutesBefore} min`,
                body: `${clase.disciplina || 'Entrenamiento'} • ${clase.Sede?.nombre || 'RitmoFit'}`,
                data: { reservaId: reserva.id, claseId: clase.id },
            },
            trigger: { type: 'date', date: triggerDate },
        });
    }).filter(Boolean);

    await Promise.all(reminders);
};

export const scheduleClassReminder = async (reserva, minutesBefore = 60) => {
    if (!reserva) return;
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await ensureAndroidChannel();
    const clase = reserva.Clase ?? reserva.clase ?? reserva?.data?.Clase ?? {};
    const start = buildStartDate(clase);
    if (!start) return;
    const triggerDate = new Date(start.getTime() - minutesBefore * 60000);
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `Clase ${clase.nombre || 'RitmoFit'} en ${minutesBefore} min`,
            body: `${clase.disciplina || 'Entrenamiento'} • ${clase.Sede?.nombre || 'RitmoFit'}`,
            data: { claseId: clase.id, reservaId: reserva.id },
        },
        trigger: { type: 'date', date: triggerDate },
    });
};

export const cancelClassReminder = async (reservaId) => {
    if (!reservaId) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targets = scheduled.filter(
        (notification) => notification?.content?.data?.reservaId === reservaId
    );

    await Promise.all(
        targets.map((notification) =>
            Notifications.cancelScheduledNotificationAsync(notification.identifier)
        )
    );
};

export const clearAllReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
};

const resolveProjectId = () => {
    return (
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.expoConfig?.extra?.projectId ||
        Constants?.manifest2?.extra?.eas?.projectId ||
        Constants?.manifest?.extra?.eas?.projectId ||
        process.env.EXPO_PROJECT_ID
    );
};

export const getExpoPushTokenAsync = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    if (Constants?.appOwnership === 'expo') {
        console.warn('Expo Go no soporta push reales. Usa un development build para habilitarlas.');
        return null;
    }

    const projectId = resolveProjectId();
    if (!projectId) {
        console.warn('No se pudo determinar el projectId de Expo. Configúralo en app.json (extra.eas.projectId).');
        return null;
    }

    try {
        const response = await Notifications.getExpoPushTokenAsync({ projectId });
        return response?.data ?? null;
    } catch (error) {
        console.warn('No se pudo obtener el token push:', error?.message || error);
        return null;
    }
};
