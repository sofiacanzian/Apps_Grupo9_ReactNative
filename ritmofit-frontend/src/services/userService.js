// src/services/userService.js
import api from './api';

export const updateProfile = async (updateData) => {
    try {
        // Llama al endpoint PUT (el servicio está bien)
        const response = await api.put('/users/me', updateData);
        return response.data.user;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar el perfil.');
    }
};

export const fetchProfile = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data.user; 
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener el perfil.');
    }
};