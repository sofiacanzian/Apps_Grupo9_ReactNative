// src/pages/auth/RequestOtpPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const RequestOtpPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    // Obtenemos requestOtp, isLoading y error del store de Zustand
    const { requestOtp, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); 

        try {
            // Llama a la función del store (que llama al backend)
            await requestOtp(email);
            
            setMessage('Código OTP enviado a tu correo. Revísalo.');
            
            // Navegar a la página de validación, pasando el email
            navigate('/auth/validate', { state: { email } }); 
        } catch (err) {
            // Si hay un error, el store lo habrá capturado
            setMessage(error || 'Error al solicitar el OTP. Verifica la consola.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h1>Acceso de Socio RitmoFit</h1>
            <p>Paso 1: Ingresa tu Email</p>
            
            <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                />
                
                <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white' }}>
                    {isLoading ? 'Enviando...' : 'Solicitar Código'}
                </button>
            </form>

            {message && <p style={{ color: error ? 'red' : 'green', marginTop: '10px' }}>{message}</p>}
        </div>
    );
};

export default RequestOtpPage;