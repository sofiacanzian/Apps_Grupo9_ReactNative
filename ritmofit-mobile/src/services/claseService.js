import api from './api';

export const getClases = async (filtros = {}) => {
    try {
        const response = await api.get('/clases', { params: filtros });
        // Backend responde con { status, results, data }
        // Devolver data si existe, sino devolver response.data para compatibilidad
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener clases.');
    }
};

export const getClaseById = async (id) => {
    try {
        const response = await api.get(`/clases/${id}`);
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener la clase.');
    }
};

export const getSedes = async () => {
    try {
        const response = await api.get('/sedes');
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener sedes.');
    }
};
