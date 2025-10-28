// src/pages/ClasesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchClases, createReserva } from '../services/claseService';

const ClasesPage = () => {
    const { user } = useAuthStore();
    const [clases, setClases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({}); // Para filtrar por sede, fecha, etc.

    const loadClases = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Llama a la API con el token JWT (manejado por el interceptor de axios)
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
        if (window.confirm(`¿Confirmas la reserva para la clase: ${claseNombre}?`)) {
            try {
                await createReserva(claseId);
                alert(`¡Reserva exitosa para ${claseNombre}!`);
                loadClases(); // Refrescar para ver los cupos actualizados
            } catch (err) {
                alert(`Error al reservar: ${err.message}`);
            }
        }
    };

    if (isLoading) return <h2>Cargando Catálogo...</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Catálogo de Clases y Turnos</h1>
            <p>Socio: {user.nombre}. Filtra, explora y reserva.</p>
            
            {/* Aquí irían los inputs para filtrar por sede, disciplina y fecha */}
            
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

const ClaseCard = ({ clase, onReserve, isSocio }) => {
    // Nota: El backend debe devolver el cupo real. Aquí usamos cupo_disponible como placeholder.
    const cupoDisponible = clase.cupo_disponible;
    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}>
            <h3>{clase.nombre}</h3>
            <p><strong>Sede:</strong> {clase.Sede ? clase.Sede.nombre : 'N/A'}</p>
            <p><strong>Instructor:</strong> {clase.User ? clase.User.nombre : 'N/A'}</p>
            <p><strong>Horario:</strong> {clase.dia} | {clase.hora_inicio} ({clase.duracion_minutos} min)</p>
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