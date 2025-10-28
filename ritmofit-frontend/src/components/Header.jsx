// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Header = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    
    // Función para manejar el logout (cierre de sesión)
    const handleLogout = () => {
        logout();
        navigate('/auth/login', { replace: true });
    };

    return (
        <header style={styles.header}>
            <div style={styles.logo}>RitmoFit | {user?.rol.toUpperCase()}</div>
            <nav style={styles.nav}>
                <Link to="/clases" style={styles.navLink}>Catálogo</Link>
                <Link to="/reservas" style={styles.navLink}>Mis Reservas</Link>
                <Link to="/historial" style={styles.navLink}>Historial</Link>
                <Link to="/perfil" style={styles.navLink}>Perfil ({user?.nombre})</Link>
            </nav>
            <button onClick={handleLogout} style={styles.logoutButton}>
                Salir
            </button>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 25px',
        backgroundColor: '#333',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    logo: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: '#4CAF50', // Verde RitmoFit
    },
    nav: {
        display: 'flex',
        gap: '20px',
    },
    navLink: {
        color: 'white',
        textDecoration: 'none',
        padding: '5px 10px',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
    }
};

export default Header;