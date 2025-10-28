// src/services/auth.service.js

import api from './api';

export const requestOtp = async (email) => {
    try {
        await api.post('/auth/request-otp', { email });
        return true;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al solicitar el código OTP.');
    }
};

// src/services/auth.service.js (dentro de loginWithOtp)

export const loginWithOtp = async (email, otpCode) => {
    try {
        const response = await api.post('/auth/login-otp', { email, otp_code: otpCode });
        
        // 🚨 CORRECCIÓN: La respuesta del backend es response.data, no response.data.data
        const { token, user } = response.data; 

        // El resto del código de guardado en store funcionará con estos valores
        return { token, user }; 
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Código OTP inválido o expirado.');
    }
};

// Implementación simple del logout: solo limpieza de localStorage
export const logout = () => {
    // Limpia las claves residuales por si el middleware falló o guardó algo extra
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('auth-storage');
};