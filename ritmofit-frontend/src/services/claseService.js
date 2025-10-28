// src/services/claseService.js
import api from './api';

export const fetchClases = async (filters = {}) => {
    const response = await api.get('/clases', { params: filters });
    return response.data.data;
};

export const createReserva = async (claseId) => {
    const response = await api.post('/reservas', { claseId });
    return response.data.message; 
};

export const fetchMisReservas = async () => {
    const response = await api.get('/reservas'); 
    return response.data.data;
};

export const cancelReserva = async (reservaId) => {
    await api.delete(`/reservas/${reservaId}`);
    return true;
};