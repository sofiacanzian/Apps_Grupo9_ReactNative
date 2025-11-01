// src/services/claseService.js
import api from './api';

export const fetchClases = async (filters = {}) => {
    try {
        const response = await api.get('/clases', { params: filters });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar el catálogo de clases.');
    }
};

export const createReserva = async (claseId) => {
    try {
        // Enviar claseId explícitamente como número (si es posible) y con el nombre esperado por el backend
        const response = await api.post('/reservas', { claseId }); 
        return response.data.message; 
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al realizar la reserva.');
    }
};

export const fetchMisReservas = async () => {
    try {
        const response = await api.get('/reservas'); 
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar tus reservas.');
    }
};

export const cancelReserva = async (reservaId) => {
    try {
        await api.delete(`/reservas/${reservaId}`);
        return true;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar la reserva.');
    }
};