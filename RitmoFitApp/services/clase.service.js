// services/clase.service.js
import api from './api';

/**
 * Obtiene la lista de clases disponibles, incluyendo datos de sede e instructor.
 * @param {string} [dia] - Filtro opcional por día.
 */
export const fetchClases = async (dia = '') => {
    try {
        const response = await api.get(`/clases`, {
            params: { dia }
        });
        return response.data.data; // Array de objetos Clase
    } catch (error) {
        console.error('Error fetching clases:', error);
        throw new Error('No se pudo cargar el horario de clases.');
    }
};

/**
 * Intenta crear una nueva reserva para la clase especificada.
 */
export const createReserva = async (claseId) => {
    try {
        const response = await api.post(`/reservas`, { claseId });
        return response.data; // { message: "Reserva creada exitosamente." }
    } catch (error) {
        // Captura errores específicos (cupo lleno, ya reservado)
        throw new Error(error.response?.data?.message || 'Error al realizar la reserva. Intenta de nuevo.');
    }
};

/**
 * Obtiene las reservas del usuario logueado.
 */
export const fetchMisReservas = async () => {
    try {
        // El backend filtra automáticamente por userId si el rol es 'socio'
        const response = await api.get(`/reservas`); 
        return response.data.data; // Array de objetos Reserva
    } catch (error) {
        console.error('Error fetching mis reservas:', error);
        throw new Error('No se pudieron cargar tus reservas.');
    }
};

/**
 * Cancela una reserva específica.
 */
export const cancelReserva = async (reservaId) => {
    try {
        await api.delete(`/reservas/${reservaId}`);
        return true; // Éxito (204 No Content)
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cancelar la reserva.');
    }
};