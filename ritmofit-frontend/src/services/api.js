// src/services/api.js (Interceprtor CORREGIDO y Activo)
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
        const persistedData = localStorage.getItem('auth-storage'); 
        let token = null;
        // ... (Tu lógica de parseo de token) ...
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