// src/pages/ClasesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchClases, createReserva } from '../services/claseService';
import SweetAlert2 from 'react-sweetalert2'; 

// ---------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------
const ClasesPage = () => {
    const { user } = useAuthStore();
    const [clases, setClases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({}); 
    const [swalProps, setSwalProps] = useState({}); // Estado para SweetAlert2

    const loadClases = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchClases(filters);
            setClases(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadClases();
    }, [filters]);

    const handleReserva = async (claseId, claseNombre) => {
        // Dispara el modal de confirmación
        setSwalProps({
            show: true,
            title: 'Confirmación de Reserva',
            text: `¿Confirma la reserva para la clase: ${claseNombre}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Reservar',
            cancelButtonText: 'Cancelar',
            
            // 🚨 CORRECCIÓN FINAL: Usar onConfirm (el nombre estándar del evento) 🚨
            onConfirm: async () => { 
                try {
                    await createReserva(claseId);
                    // Mostrar alerta de éxito
                    setSwalProps({
                        show: true,
                        title: '¡Reserva Exitosa!',
                        text: `La clase ${claseNombre} fue reservada.`,
                        icon: 'success'
                    });
                    loadClases(); // Refrescar los cupos
                } catch (err) {
                    // Mostrar alerta de error
                    setSwalProps({
                        show: true,
                        title: 'Error de Reserva',
                        text: err.message || 'Ocurrió un error inesperado.',
                        icon: 'error'
                    });
                }
            },
            // 🚨 Usar onCancel (El nombre estándar que evita warnings) 🚨
            onCancel: () => {
                setSwalProps({}); // Cierra el modal sin hacer nada
            }
        });
    };

    if (isLoading) return <h2>Cargando Catálogo...</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    return (
        <div style={{ padding: '20px' }}>
            {/* Componente SweetAlert2: usa onClose para limpiar el estado */}
            <SweetAlert2 {...swalProps} onClose={() => setSwalProps({})} />
            
            <h1>Catálogo de Clases y Turnos</h1>
            <p>Socio: {user.nombre}. Filtra, explora y reserva.</p>
            
            {/* Área de filtros iría aquí */}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {clases.map(clase => (
                    <ClaseCard 
                        key={clase.id} 
                        clase={clase} 
                        onReserve={handleReserva} 
                        isSocio={user.rol === 'socio'}
                    />
                ))}
            </div>
            
            {clases.length === 0 && <p>No hay clases disponibles.</p>}
        </div>
    );
};

// ---------------------------------------------------------------
// Componente de Tarjeta de Clase (ClaseCard)
// ---------------------------------------------------------------
const ClaseCard = ({ clase, onReserve, isSocio }) => {
    const formattedDate = new Date(clase.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Usa cupo_disponible que viene calculado del backend
    const cupoDisponible = clase.cupo_disponible; 
    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}>
            <h3>{clase.nombre}</h3>
            <p><strong>Sede:</strong> {clase.Sede ? clase.Sede.nombre : 'N/A'}</p>
            <p><strong>Instructor:</strong> {clase.User ? clase.User.nombre : 'N/A'}</p>
            
            <p><strong>Horario:</strong> {formattedDate} | {clase.hora_inicio} ({clase.duracion_minutos} min)</p>
            
            <p style={{ color: cupoDisponible > 0 ? 'blue' : 'red' }}>
                Cupos: {cupoDisponible}
            </p>
            
            {isSocio && (
                <button 
                    onClick={() => onReserve(clase.id, clase.nombre)}
                    style={{ padding: '10px 15px', backgroundColor: cupoDisponible > 0 ? '#4CAF50' : '#888', color: 'white' }}
                    disabled={cupoDisponible <= 0}
                >
                    {cupoDisponible > 0 ? 'Reservar' : 'Cupo Lleno'}
                </button>
            )}
        </div>
    );
};

export default ClasesPage;