// src/pages/HistorialPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
// 🚨 NUEVAS IMPORTACIONES PARA EL CALENDARIO Y ESTILOS 🚨
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; 
import { es } from 'date-fns/locale'; 

const HistorialPage = () => {
    // Cambiamos los estados de filtro para guardar objetos Date o null
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    // Función auxiliar para convertir objeto Date a formato AAAA-MM-DD para la API
    const formatDateToISO = (date) => {
        if (!date) return '';
        // toISOString() devuelve algo como '2025-10-31T03:00:00.000Z', solo tomamos la parte de la fecha
        return date.toISOString().split('T')[0];
    };

    const loadHistorial = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Convertir objetos Date a strings AAAA-MM-DD para la API
            const fechaInicioISO = formatDateToISO(fechaInicio);
            const fechaFinISO = formatDateToISO(fechaFin);

            const response = await api.get('/asistencias/historial', {
                params: {
                    fechaInicio: fechaInicioISO,
                    fechaFin: fechaFinISO,
                }
            });
            setHistorial(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el historial.');
        } finally {
            setIsLoading(false);
        }
    };

    // Recargar cuando las fechas cambian
    useEffect(() => {
        loadHistorial();
    }, [fechaInicio, fechaFin]); 


    if (isLoading) return <h2>Cargando Historial...</h2>;
    if (error) return <h2 style={{ color: 'red' }}>Error: {error}</h2>;

    return (
        <div style={styles.padding}>
            <h1>Historial de Asistencias</h1>
            
            {/* Controles de Filtro por Rango de Fechas */}
            <div style={styles.filtroContainer}>
                <label>Inicio:</label>
                <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => setFechaInicio(date)}
                    selectsStart
                    startDate={fechaInicio}
                    endDate={fechaFin}
                    dateFormat="dd/MM/yyyy" // Formato amigable para el usuario
                    isClearable={true}
                    placeholderText="DD/MM/AAAA"
                    locale={es} // Idioma español
                    wrapperClassName="datePicker" // Clase para envolver y estilizar
                />

                <label>Fin:</label>
                <DatePicker
                    selected={fechaFin}
                    onChange={(date) => setFechaFin(date)}
                    selectsEnd
                    startDate={fechaInicio}
                    endDate={fechaFin}
                    minDate={fechaInicio} // La fecha final no puede ser anterior a la inicial
                    dateFormat="dd/MM/yyyy"
                    isClearable={true}
                    placeholderText="DD/MM/AAAA"
                    locale={es}
                    wrapperClassName="datePicker"
                />
            </div>

            {/* Listado de Historial */}
            <div style={styles.historialList}>
                {historial.length === 0 ? (
                    <p>No hay asistencias registradas en este período. 😟</p>
                ) : (
                    historial.map((asistencia, index) => (
                        // Formatear la fecha de asistencia para la visualización
                        <div key={index} style={styles.asistenciaCard}>
                            <p><strong>Clase:</strong> {asistencia.Clase ? asistencia.Clase.nombre : 'N/A'}</p>
                            <p><strong>Sede:</strong> {asistencia.Clase && asistencia.Clase.Sede ? asistencia.Clase.Sede.nombre : 'N/A'}</p>
                            <p><strong>Fecha:</strong> {new Date(asistencia.fecha_asistencia).toLocaleDateString('es-AR')}</p>
                            <p><strong>Hora:</strong> {asistencia.checkin_hora}</p>
                            <p><strong>Duración:</strong> {asistencia.duracion_minutos} min</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    padding: { padding: '20px' },
    filtroContainer: {
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    // Nota: El estilo 'input' ya no se aplica al input nativo, sino al wrapper del DatePicker.
    // Los estilos base se aplican desde 'react-datepicker.css'.
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