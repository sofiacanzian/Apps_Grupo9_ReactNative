// src/pages/ReservasPage.jsx
import React, { useState, useEffect } from 'react';
import { fetchMisReservas, cancelReserva } from '../services/claseService';

const ReservasPage = () => {
    const [reservas, setReservas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadReservas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMisReservas();
            setReservas(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReservas();
    }, []);

    const handleCancel = async (reservaId, claseNombre) => {
        if (window.confirm(`¿Seguro que deseas cancelar la reserva de ${claseNombre}?`)) {
            try {
                await cancelReserva(reservaId);
                alert(`Reserva de ${claseNombre} cancelada.`);
                loadReservas(); // Refrescar la lista
            } catch (err) {
                alert(`Error al cancelar: ${err.message}`);
            }
        }
    };

    if (isLoading) return <h2>Cargando tus reservas...</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Mis Próximas Reservas</h1>
            
            {reservas.length === 0 ? (
                <p>No tienes reservas activas. ¡Reserva una clase hoy! 📅</p>
            ) : (
                reservas.map(reserva => {
                    // 🚨 CORRECCIÓN CLAVE: Formatear la fecha 🚨
                    const fechaClase = new Date(reserva.Clase.fecha).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });

                    return (
                        // 🚨 Usar reserva.id como clave única 🚨
                        <div key={reserva.id} style={styles.reservaCard}> 
                            <h3>{reserva.Clase.nombre}</h3>
                            <p><strong>Sede:</strong> {reserva.Clase.Sede.nombre}</p>
                            
                            {/* 🚨 MOSTRAR FECHA FORMATEADA Y HORA 🚨 */}
                            <p><strong>Horario:</strong> {fechaClase} | {reserva.Clase.hora_inicio}</p>
                            
                            <p>Estado: Confirmada</p>
                            
                            <button 
                                onClick={() => handleCancel(reserva.id, reserva.Clase.nombre)}
                                style={styles.cancelButton}
                            >
                                Cancelar Reserva
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const styles = {
    reservaCard: {
        border: '1px solid #007bff',
        padding: '15px',
        margin: '10px 0',
        borderRadius: '8px',
    },
    cancelButton: {
        backgroundColor: '#FF6347',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px',
    }
};

export default ReservasPage;