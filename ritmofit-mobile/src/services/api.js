import axios from 'axios';
// Decoupled from the auth store to avoid require cycles. Token is injected via tokenManager.
import { getToken, invokeLogout } from './tokenManager';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// BASE URL resolution order:
// 1. If EXPLICIT_API_URL is set in expo constants (e.g. in app.json extra) use it
// 2. If running on Android emulator -> use 10.0.2.2 to reach host localhost
// 3. Default to localhost
const explicit = Constants?.manifest?.extra?.EXPLICIT_API_URL || Constants?.expoConfig?.extra?.EXPLICIT_API_URL;

const hostForPlatform = () => {
    if (explicit) return explicit;
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
    // iOS simulator and Expo web will use localhost
    return 'http://localhost:3000/api';
};

const BASE_URL = hostForPlatform();

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Evita que las peticiones queden colgadas indefinidamente — fallan tras 10s
    timeout: 10000,
});

// Interceptor para agregar token a cada solicitud
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si recibimos 401 forzamos logout
        if (error.response?.status === 401) {
            invokeLogout();
        }

        // Detectar timeout o errores de red para dar feedback más claro en el cliente
        if (error.code === 'ECONNABORTED') {
            // timeout
            console.warn('[api] request timeout', error.config?.url);
            return Promise.reject(new Error('La petición tardó demasiado. Reintenta más tarde.'));
        }

        if (!error.response) {
            // network / CORS / DNS
            console.warn('[api] network error or no response for', error.config?.url, error.message);
            return Promise.reject(new Error('No se pudo conectar con el servidor. Revisa tu conexión.'));
        }

        return Promise.reject(error);
    }
);

export default api;
