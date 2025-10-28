// src/pages/HistorialPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuthStore } from '../store/authStore';

const HistorialPage = () => {
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState({ fechaInicio: '', fechaFin: '' });

    const loadHistorial = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Llama al nuevo endpoint con los filtros
            const response = await api.get('/asistencias/historial', {
                params: {
                    fechaInicio: filtro.fechaInicio,
                    fechaFin: filtro.fechaFin,
                }
            });
            setHistorial(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el historial.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistorial();
    }, [filtro]); // Recarga cuando cambian los filtros

    if (isLoading) return <h2>Cargando Historial...</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Historial de Asistencias</h1>
            
            {/* Controles de Filtro por Rango de Fechas */}
            <div style={styles.filtroContainer}>
                <label>Inicio:</label>
                <input 
                    type="date" 
                    value={filtro.fechaInicio} 
                    onChange={(e) => setFiltro({...filtro, fechaInicio: e.target.value})}
                    style={styles.input}
                />
                <label>Fin:</label>
                <input 
                    type="date" 
                    value={filtro.fechaFin} 
                    onChange={(e) => setFiltro({...filtro, fechaFin: e.target.value})}
                    style={styles.input}
                />
            </div>

            {/* Listado de Historial */}
            <div style={styles.historialList}>
                {historial.length === 0 ? (
                    <p>No hay asistencias registradas en este período.</p>
                ) : (
                    historial.map((asistencia, index) => (
                        <div key={index} style={styles.asistenciaCard}>
                            <p><strong>Clase:</strong> {asistencia.Clase.nombre}</p>
                            <p><strong>Sede:</strong> {asistencia.Clase.Sede.nombre}</p>
                            <p><strong>Fecha:</strong> {asistencia.fecha_asistencia}</p>
                            <p><strong>Duración:</strong> {asistencia.duracion_minutos} min</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    filtroContainer: {
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    input: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    historialList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '15px',
    },
    asistenciaCard: {
        border: '1px solid #4CAF50',
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: '#e8f5e9',
    }
};

export default HistorialPage;