// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANTE: Reemplaza con la IP de tu PC (ej: 192.168.1.5). 
// NO uses localhost o 127.0.0.1. El backend debe estar corriendo (npm run dev).
const BASE_URL = '192.168.1.21'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Interceptor para añadir el token JWT a todas las peticiones protegidas.
 */
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;