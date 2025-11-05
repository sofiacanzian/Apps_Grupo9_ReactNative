// src/services/claseService.js
import api from './api';
import { useAuthStore } from '../store/authStore'; 

// --- Función Auxiliar para Obtener Headers con Token ---
const getConfig = () => {
    // Lee el token directamente del estado de Zustand
    const token = useAuthStore.getState().token; 
    if (!token) return {}; 
    return {
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    };
};

// 🚨 FUNCIÓN FALTANTE: FETCH CLASES (Ruta Pública) 🚨
export const fetchClases = async (filters = {}) => {
    // Las clases son públicas, pero enviamos el token en la configuración
    // por si el backend tiene lógica condicional.
    const config = getConfig();
    try {
        const response = await api.get('/clases', { params: filters, ...config });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar el catálogo de clases.');
    }
};

// --- Rutas Protegidas ---

export const createReserva = async (claseId) => {
    const config = getConfig();
    try {
        const response = await api.post('/reservas', { claseId }, config); 
        return response.data.message; 
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al realizar la reserva.');
    }
};

export const fetchMisReservas = async () => {
    const config = getConfig();
    try {
        const response = await api.get('/reservas', config); 
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar tus reservas.');
    }
};

export const cancelReserva = async (reservaId) => {
    const config = getConfig();
    try {
        await api.delete(`/reservas/${reservaId}`, config);
        return true;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar la reserva.');
    }
};

export const fetchHistorial = async (filters = {}) => {
    const config = getConfig();
    try {
        // La URL es /api/asistencias/historial
        const response = await api.get('/asistencias/historial', { params: filters, ...config });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar el historial de asistencias.');
    }
};