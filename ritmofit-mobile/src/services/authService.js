import api from './api';

const extractData = (response) => response?.data?.data ?? response?.data ?? response;

export const login = async ({ identifier, password }) => {
    try {
        const response = await api.post('/auth/login', { identifier, password });
        const data = extractData(response);
        return { token: data.token ?? response?.data?.token, user: data.user ?? response?.data?.user };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Credenciales inválidas.');
    }
};

export const register = async (payload) => {
    try {
        const response = await api.post('/auth/register', payload);
        return extractData(response);
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo crear la cuenta.');
    }
};

export const verifyRegistrationOtp = async ({ email, otpCode }) => {
    try {
        const response = await api.post('/auth/register/verify', {
            email,
            otp_code: otpCode,
        });
        const data = extractData(response);
        return { token: data.token ?? response?.data?.token, user: data.user ?? response?.data?.user };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Código inválido o expirado.');
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post('/auth/password/reset/request', { email });
        return extractData(response);
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo iniciar el reinicio de contraseña.');
    }
};

export const confirmPasswordReset = async ({ email, otpCode, password, confirmPassword }) => {
    try {
        const response = await api.post('/auth/password/reset/confirm', {
            email,
            otp_code: otpCode,
            newPassword: password,
            confirmPassword,
        });
        return extractData(response);
    } catch (error) {
        throw new Error(error.response?.data?.message || 'No se pudo actualizar la contraseña.');
    }
};

export const logout = () => {
    console.log('✓ Logout completado');
};
