import api from './api';

export const createReserva = async (claseId) => {
    try {
        const response = await api.post('/reservas', { claseId });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear la reserva.');
    }
};

export const cancelReserva = async (reservaId) => {
    try {
        const response = await api.delete(`/reservas/${reservaId}`);
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar la reserva.');
    }
};

export const getReservas = async ({ tipo = 'proximas', ...params } = {}) => {
    try {
        const response = await api.get('/reservas', { params: { tipo, ...params } });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener reservas.');
    }
};

export const getAsistencias = async (filtros = {}) => {
    try {
        const response = await api.get('/historial', { params: filtros });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener asistencias.');
    }
};

export const registerCheckIn = async (claseId) => {
    try {
        const response = await api.post('/asistencias/checkin', { claseId });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo registrar la asistencia.');
    }
};
