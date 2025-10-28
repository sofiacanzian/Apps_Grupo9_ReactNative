// src/router/AppRouter.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Vistas Públicas
import RequestOtpPage from '../pages/auth/RequestOtpPage';
import LoginOtpPage from '../pages/auth/LoginOtpPage';

// Vistas Privadas
import ClasesPage from '../pages/ClasesPage';
import ProfilePage from '../pages/ProfilePage';
import ReservasPage from '../pages/ReservasPage';
import HistorialPage from '../pages/HistorialPage'; // Importación correcta
import MainLayout from '../components/MainLayout'; // <-- IMPORTAR LAYOUT

// Componente para proteger rutas
const PrivateRoute = ({ element: Element }) => {
    const { isAuthenticated } = useAuthStore();
    
    return isAuthenticated() ? (
        // 🚨 ENVOLVER LAS PÁGINAS PRIVADAS EN EL LAYOUT 🚨
        <MainLayout>
            {Element}
        </MainLayout>
    ) : (
        <Navigate to="/auth/login" replace />
    ); 
};

const AppRouter = () => {
    return (
        <Routes>
            {/* ----------------------------------------------------- */}
            {/* RUTAS PÚBLICAS (AUTENTICACIÓN) */}
            {/* ----------------------------------------------------- */}
            
            {/* Si el usuario va a /, lo mandamos al catálogo de clases. PrivateRoute 
                lo atrapará si no está logueado y lo mandará a /auth/login.
            */}
            <Route path="/" element={<Navigate to="/clases" replace />} /> 

            <Route path="/auth/login" element={<RequestOtpPage />} />
            <Route path="/auth/validate" element={<LoginOtpPage />} />

            {/* ----------------------------------------------------- */}
            {/* RUTAS PRIVADAS (REQUIEREN TOKEN JWT) */}
            {/* ----------------------------------------------------- */}
            
            <Route path="/clases" element={<PrivateRoute element={<ClasesPage />} />} /> 
            <Route path="/reservas" element={<PrivateRoute element={<ReservasPage />} />} />
            <Route path="/perfil" element={<PrivateRoute element={<ProfilePage />} />} />
            <Route path="/historial" element={<PrivateRoute element={<HistorialPage />} />} />

            {/* Manejo de rutas no definidas: redirige a la página principal (clases) */}
            <Route path="*" element={<Navigate to="/clases" replace />} />
        </Routes>
    );
};

export default AppRouter;