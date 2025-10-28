// src/store/authStore.js

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as authService from '../services/authService';

export const useAuthStore = create(
    // Envolvemos el store en el middleware 'persist'
    persist( 
        (set, get) => ({
            token: null, 
            user: null,
            isLoading: false,
            error: null,

            // Petición para solicitar el código OTP
            requestOtp: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await authService.requestOtp(email);
                    set({ isLoading: false });
                    return true;
                } catch (err) {
                    const message = err.message || 'Error al solicitar el código.';
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            // Petición para iniciar sesión con el código OTP
            login: async (email, otpCode) => {
                set({ isLoading: true, error: null });
                try {
                    const { token, user } = await authService.loginWithOtp(email, otpCode);
                    
                    // Solo actualizamos el estado. 'persist' se encarga de localStorage.
                    set({ token, user, isLoading: false, error: null }); 
                    
                    return true;
                } catch (err) {
                    const message = err.message || 'Código OTP inválido o expirado.';
                    set({ token: null, user: null, isLoading: false, error: message }); 
                    return false;
                }
            },

            // Cierre de sesión
            logout: () => {
                // Llama al servicio para limpiar localStorage (si hay claves extra)
                authService.logout(); 
                // Limpia el estado del store, forzando la redirección del router
                set({ token: null, user: null }); 
            },

            // Función de verificación de autenticación
            isAuthenticated: () => get().token !== null,
        }),
        {
            // Configuración de la persistencia
            name: 'auth-storage', 
            storage: createJSONStorage(() => localStorage),
        }
    )
);