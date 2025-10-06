// services/auth.service.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Endpoint para solicitar el código OTP (Paso 1 del Login)
export const requestOtp = async (email) => {
    try {
        // En el backend, si el usuario no existe, se crea.
        const response = await api.post('/auth/request-otp', { email });
        return response.data; // Devuelve { message: "Código enviado..." }
    } catch (error) {
        // Captura el mensaje de error de Express (ej: 400 Bad Request)
        throw new Error(error.response?.data?.message || 'Error al solicitar el código.');
    }
};

// Endpoint para iniciar sesión con el código OTP (Paso 2 del Login)
export const loginWithOtp = async (email, otpCode) => {
    try {
        const response = await api.post('/auth/login-otp', { email, otp_code: otpCode });
        
        // Si el login es exitoso, guardamos el token JWT para futuras peticiones
        const { token, user } = response.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        return user; // Devuelve la información del usuario
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Código OTP inválido o expirado.');
    }
};

// Función para cerrar sesión
export const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
};

// Función para obtener el usuario logueado (ejemplo: para persistencia)
export const getCurrentUser = async () => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
};