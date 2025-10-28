// src/pages/ProfilePage.jsx
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
    // Obtenemos el estado y la función de logout del store
    const { user, logout } = useAuthStore();

    // Si no hay usuario, redirigir a la página de login (aunque AppRouter ya lo hace)
    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    const handleLogout = () => {
        // Llama a la función de logout del store
        logout();
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <h1>Perfil de Socio</h1>
            
            <div style={styles.infoBox}>
                <h2>Datos Personales</h2>
                <p><strong>Nombre:</strong> {user.nombre || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID de Socio:</strong> {user.id}</p>
                <p><strong>Rol:</strong> <span style={styles.roleTag}>{user.rol.toUpperCase()}</span></p>
            </div>

            <div style={styles.actions}>
                <button 
                    onClick={handleLogout}
                    style={styles.logoutButton}
                >
                    Cerrar Sesión (Logout)
                </button>
            </div>
            
            {/* Opcional: Enlaces de navegación rápida */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                <a href="/" style={{ marginRight: '15px' }}>Catálogo de Clases</a>
                <a href="/reservas">Mis Reservas</a>
            </div>
        </div>
    );
};

const styles = {
    infoBox: {
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f9f9f9',
    },
    roleTag: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.9em',
    },
    actions: {
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '12px 25px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
    }
};

export default ProfilePage;