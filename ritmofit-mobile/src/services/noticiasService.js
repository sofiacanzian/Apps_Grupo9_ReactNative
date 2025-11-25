import api from './api';

/**
 * Obtiene todas las noticias y promociones
 * @param {Object} filtros - Filtros opcionales (page, limit, tipo, etc)
 * @returns {Promise<Array>} Lista de noticias
 */
export const getNoticias = async (filtros = {}) => {
  try {
    const response = await api.get('/noticias', { params: filtros });
    // API responde { status, results, data }
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching noticias:', error);
    throw new Error(error.response?.data?.message || 'No se pudieron cargar las noticias');
  }
};

/**
 * Obtiene una noticia específica por ID
 * @param {number} noticiaId - ID de la noticia
 * @returns {Promise<Object>} Detalle de la noticia
 */
export const getNoticiaDetalle = async (noticiaId) => {
  try {
    const response = await api.get(`/noticias/${noticiaId}`);
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching noticia detail:', error);
    throw new Error(error.response?.data?.message || 'No se pudo cargar la noticia');
  }
};

/**
 * Obtiene noticias destacadas/promociones principales
 * @param {number} limit - Cantidad de noticias a traer (default: 5)
 * @returns {Promise<Array>} Noticias destacadas
 */
export const getNoticiasDestacadas = async (limit = 5) => {
  try {
    const response = await api.get('/noticias', { 
      params: { 
        destacadas: true, 
        limit,
        sort: '-fecha_publicacion'
      } 
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching noticias destacadas:', error);
    throw new Error(error.response?.data?.message || 'No se pudieron cargar las noticias destacadas');
  }
};

/**
 * Obtiene promociones vigentes
 * @param {Object} filtros - Filtros opcionales
 * @returns {Promise<Array>} Lista de promociones activas
 */
export const getPromociones = async (filtros = {}) => {
  try {
    const response = await api.get('/noticias', { 
      params: { 
        tipo: 'promocion',
        vigente: true,
        ...filtros
      } 
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching promociones:', error);
    throw new Error(error.response?.data?.message || 'No se pudieron cargar las promociones');
  }
};

/**
 * Obtiene eventos especiales
 * @param {Object} filtros - Filtros opcionales
 * @returns {Promise<Array>} Lista de eventos
 */
export const getEventos = async (filtros = {}) => {
  try {
    const response = await api.get('/noticias', { 
      params: { 
        tipo: 'evento',
        ...filtros
      } 
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching eventos:', error);
    throw new Error(error.response?.data?.message || 'No se pudieron cargar los eventos');
  }
};

/**
 * Marca una noticia como leída (opcional, para tracking)
 * @param {number} noticiaId - ID de la noticia
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const marcarNoticiaLeida = async (noticiaId) => {
  try {
    const response = await api.post(`/noticias/${noticiaId}/leida`);
    return response.data;
  } catch (error) {
    console.error('Error marking noticia as read:', error);
    // No lanzar error, es opcional
    return null;
  }
};
