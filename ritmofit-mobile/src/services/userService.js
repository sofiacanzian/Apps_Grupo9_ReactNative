import api from './api';

const extractUser = (response) => {
    if (!response) return null;
    return response.data?.user ?? response.data?.data ?? response.data;
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/me');
        return extractUser(response);
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al obtener perfil.');
    }
};

export const updateUserProfile = async (userData) => {
    try {
        const response = await api.put('/users/me', userData);
        return extractUser(response);
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al actualizar perfil.');
    }
};

export const uploadProfilePhoto = async (foto_url) => {
    try {
        if (!foto_url) {
            throw new Error('No se proporcionó una imagen válida.');
        }
        return await updateUserProfile({ foto_url });
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Error al subir foto.');
    }
};

export const requestAccountDeletionOtp = async () => {
    try {
        const response = await api.post('/users/delete/request');
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo enviar el código.');
    }
};

export const confirmAccountDeletion = async (otpCode) => {
    try {
        const response = await api.post('/users/delete/confirm', { otp_code: otpCode });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo eliminar la cuenta.');
    }
};

export const registerPushToken = async (expoPushToken) => {
    try {
        await api.post('/users/push-token', { expoPushToken });
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo registrar el token push.');
    }
};

export const clearPushToken = async () => {
    try {
        await api.delete('/users/push-token');
    } catch (error) {
        // opcional: ignorar
    }
};
