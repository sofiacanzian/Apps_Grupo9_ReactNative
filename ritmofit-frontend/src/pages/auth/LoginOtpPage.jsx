// src/pages/auth/LoginOtpPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const LoginOtpPage = () => {
    const location = useLocation();
    const email = location.state?.email; 

    const [otpCode, setOtpCode] = useState('');
    const { login, requestOtp, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    // Redirigir a login si el email no está presente (navegación directa no permitida)
    if (!email) {
        return <Navigate to="/auth/login" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const success = await login(email, otpCode);
        
        if (success) {
            // Si el login es exitoso, navegar a la página principal
            navigate('/', { replace: true });
        }
        // El store maneja la actualización del estado y el mensaje de error.
    };
    
    const handleResendOtp = async () => {
        // Implementación de la funcionalidad "Recupero de acceso"
        try {
            await requestOtp(email);
            alert("Nuevo código OTP solicitado y enviado.");
        } catch (err) {
            alert("Error al reenviar el código.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h1>Paso 2: Validar Código de Acceso</h1>
            <p>Ingresa el código que enviamos a: <strong>{email}</strong></p>
            
            <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Código OTP (6 dígitos):</label>
                <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    maxLength="6"
                    disabled={isLoading}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                />
                
                <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white' }}>
                    {isLoading ? 'Verificando...' : 'Acceder'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button onClick={handleResendOtp} disabled={isLoading} style={{ border: 'none', background: 'transparent', color: '#007bff', cursor: 'pointer' }}>
                    Reenviar Código de Acceso
                </button>
                <p style={{ marginTop: '10px' }}>
                    <Link to="/auth/login">Volver / Cambiar Email</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginOtpPage;