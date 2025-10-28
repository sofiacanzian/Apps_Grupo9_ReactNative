// src/services/api.js (Interceprtor CORREGIDO)
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // 1. Obtener la cadena de datos de persistencia de Zustand
        const persistedData = localStorage.getItem('auth-storage'); 
        let token = null;

        if (persistedData) {
            try {
                // 2. Parsear el objeto completo
                const authData = JSON.parse(persistedData);
                
                // 3. Navegar a través de la estructura anidada { state: { token: '...' } }
                // Esta es la ruta que Zustand usa
                token = authData?.state?.token; 
            } catch (e) {
                // Esto ocurre si el localStorage está corrupto
                console.error("Error al parsear el estado de autenticación:", e);
            }
        }

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