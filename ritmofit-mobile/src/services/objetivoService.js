import api from './api';

export const getObjetivos = async () => {
    try {
        const response = await api.get('/objetivos');
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener objetivos.');
    }
};

export const createObjetivo = async (objetivoData) => {
    try {
        const response = await api.post('/objetivos', objetivoData);
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al crear objetivo.');
    }
};

export const updateObjetivo = async (id, objetivoData) => {
    try {
        const response = await api.put(`/objetivos/${id}`, objetivoData);
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar objetivo.');
    }
};

export const deleteObjetivo = async (id) => {
    try {
        const response = await api.delete(`/objetivos/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al eliminar objetivo.');
    }
};

export const getObjetivoProgress = async (id) => {
    try {
        const response = await api.get(`/objetivos/${id}/progress`);
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener progreso.');
    }
};

