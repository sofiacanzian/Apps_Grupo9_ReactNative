// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { requestOtp, loginWithOtp, logout, getCurrentUser } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Crear el Contexto
export const AuthContext = createContext();

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => useContext(AuthContext);

// Proveedor del Contexto
export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);

    // ------------------------------------------
    // 1. Lógica de Autenticación
    // ------------------------------------------

    const signIn = async (email, otpCode) => {
        try {
            const userData = await loginWithOtp(email, otpCode);
            
            // Si el login fue exitoso, el token y userData ya están guardados en AsyncStorage
            // (gracias a auth.service.js)
            const token = await AsyncStorage.getItem('userToken');
            
            setUserToken(token);
            setUser(userData);
            return { success: true };

        } catch (error) {
            console.error('Login error:', error.message);
            return { success: false, error: error.message };
        }
    };

    const signOut = async () => {
        await logout();
        setUserToken(null);
        setUser(null);
        // Opcional: limpiar cabecera de axios
        api.defaults.headers.Authorization = undefined; 
    };

    // ------------------------------------------
    // 2. Persistencia de Sesión (Cargar al inicio)
    // ------------------------------------------

    const checkLoginStatus = async () => {
        try {
            // Verifica si hay un token guardado
            const token = await AsyncStorage.getItem('userToken');
            const userData = await getCurrentUser();

            if (token && userData) {
                // Si hay un token y datos, establece la sesión
                setUserToken(token);
                setUser(userData);
                // Asegurar que axios tenga el token para peticiones futuras
                api.defaults.headers.Authorization = `Bearer ${token}`; 
            }
        } catch (e) {
            console.error('Error al cargar la sesión:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto que se ejecuta solo una vez al montar el componente
    useEffect(() => {
        checkLoginStatus();
    }, []);


    // ------------------------------------------
    // 3. Objeto de Contexto
    // ------------------------------------------

    const contextValue = {
        // Estados
        isLoading,
        userToken,
        user,
        // Funciones de Backend (Request OTP está fuera del Contexto, pero el login no)
        requestOtp, 
        signIn,
        signOut,
        // Datos adicionales
        isAdmin: user?.rol === 'admin',
        isInstructor: user?.rol === 'instructor',
        isSocio: user?.rol === 'socio',
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};