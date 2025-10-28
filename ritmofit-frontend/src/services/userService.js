// src/services/userService.js
import api from './api';

export const updateProfile = async (updateData) => {
    try {
        // Llama al endpoint PUT
        const response = await api.put('/users/me', updateData);
        return response.data.user;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar el perfil.');
    }
};