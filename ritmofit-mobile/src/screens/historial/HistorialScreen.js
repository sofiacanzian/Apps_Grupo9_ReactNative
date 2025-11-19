import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAsistencias } from '../../services/reservaService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const RANGOS = [
  { key: 'mes', label: 'Último mes', dias: 30 },
  { key: 'todo', label: 'Todo' },
];

const HistorialScreen = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rango, setRango] = useState('mes');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [calificaciones, setCalificaciones] = useState({}); 
  const { user } = useAuthStore();

  useEffect(() => {
    loadAsistencias();
  }, [rango]);

  const buildParams = () => {
    const rangoConfig = RANGOS.find((item) => item.key === rango);
    if (rangoConfig?.dias) {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - rangoConfig.dias);
      return { fechaInicio: fechaInicio.toISOString().split('T')[0] };
    }
    return {};
  };

  const loadCalificaciones = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/calificaciones/user/${user.id}`);
      const calificacionesArray = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.data) ? response.data.data : []);
      
      const calificacionesMap = {};
      calificacionesArray.forEach((cal) => {
        const claseId = cal.claseId || cal.Clase?.id;
        if (claseId) {
          calificacionesMap[claseId] = {
            rating: cal.rating,
            comentario: cal.comentario,
          };
        }
      });
      setCalificaciones(calificacionesMap);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
    }
  };

  const loadAsistencias = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await getAsistencias(buildParams());
        const asistenciasArray = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : []);
      setAsistencias(asistenciasArray);
      
      await loadCalificaciones();
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderAsistencia = ({ item }) => {
    const clase = item.Clase ?? {};
    const claseId = clase.id || item.claseId;
    const claseNombre = clase.nombre || item.clase_nombre || '—';
    const fechaRaw = item.fecha_asistencia || item.fecha || null;
    const fecha = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : '—';
    const sede = clase.Sede?.nombre || item.sede || '—';
    const duracion = clase.duracion_minutos || item.duracion_minutos || '—';
    const disciplina = clase.disciplina || 'General';
    const instructor = clase.instructor?.nombre || 'Profesor asignado';
    const checkInHora = item.checkin_hora || '—';
    const confirmadoQr = item.confirmado_por_qr;
    
    let fechaHoraFinClase = null;
    if (fechaRaw) {
      const fechaClase = new Date(fechaRaw);
      // Usar la hora de inicio de la clase si está disponible
      const horaInicio = clase.hora_inicio || item.hora_inicio;
      const duracionMinutos = clase.duracion_minutos || item.duracion_minutos || 60;
      
      if (horaInicio) {
        // Combinar fecha con hora de inicio
        const [horas, minutos] = horaInicio.split(':').map(Number);
        fechaClase.setHours(horas, minutos || 0, 0, 0);
        // Sumar la duración para obtener la hora de finalización
        fechaHoraFinClase = new Date(fechaClase.getTime() + duracionMinutos * 60 * 1000);
      } else {
        // Si no hay hora de inicio, usar el final del día de la clase
        fechaClase.setHours(23, 59, 59, 999);
        fechaHoraFinClase = fechaClase;
      }
    }
    
    const ahora = new Date();
    const diferenciaHoras = fechaHoraFinClase 
      ? (ahora - fechaHoraFinClase) / (1000 * 60 * 60)
      : Infinity; // Si no hay fecha, no puede calificar
    const puedeCalificar = diferenciaHoras > 0 && diferenciaHoras <= 24; // Debe haber pasado al menos un momento y no más de 24 horas 
    const calificacion = claseId ? calificaciones[claseId] : null;
    const yaCalificada = !!calificacion;
    const puedeAbrirModal = puedeCalificar && !yaCalificada;

    return (
      <View style={styles.asistenciaCard}>
        <View style={styles.asistenciaHeader}>
          <Text style={styles.claseNombre}>{claseNombre}</Text>
          <Text style={styles.badge}>{disciplina}</Text>
        </View>
        <Text style={styles.asistenciaText}>📅 {fecha} · ⏰ {checkInHora}</Text>
        <Text style={styles.asistenciaText}>📍 {sede}</Text>
        <Text style={styles.asistenciaText}>👤 Instructor: {instructor}</Text>
        <Text style={styles.asistenciaText}>⏱️ {duracion} minutos</Text>
        <Text style={[styles.asistenciaText, confirmadoQr ? styles.qrText : styles.manualText]}>
          {confirmadoQr ? '✅ Check-in con QR' : 'ℹ️ Check-in manual'}
        </Text>
        
        {yaCalificada && (
          <View style={styles.calificacionContainer}>
            <View style={styles.calificacionHeader}>
              <Text style={styles.calificacionLabel}>Tu calificación:</Text>
              <View style={styles.calificacionStars}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Ionicons
                    key={num}
                    name={calificacion.rating >= num ? 'star' : 'star-outline'}
                    size={18}
                    color={calificacion.rating >= num ? '#fbbf24' : '#d1d5db'}
                  />
                ))}
                <Text style={styles.calificacionRatingText}>{calificacion.rating}/5</Text>
              </View>
            </View>
            {calificacion.comentario && (
              <View style={styles.comentarioContainer}>
                <Text style={styles.comentarioLabel}>Tu comentario:</Text>
                <Text style={styles.comentarioText}>{calificacion.comentario}</Text>
              </View>
            )}
          </View>
        )}
        
        {puedeAbrirModal ? (
          <TouchableOpacity
            style={styles.calificarButton}
            onPress={() => abrirModalCalificacion(item)}
          >
            <Text style={styles.calificarButtonText}>Calificar clase</Text>
          </TouchableOpacity>
        ) : yaCalificada ? (
          <View style={styles.yaCalificadaContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.yaCalificadaText}>Ya calificaste esta clase</Text>
          </View>
        ) : (
          <Text style={styles.calificacionExpirada}>Calificación expirada</Text>
        )}
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAsistencias(true);
  };

  const abrirModalCalificacion = (asistencia) => {
    setSelectedAsistencia(asistencia);
    setRating(0);
    setComentario('');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setSelectedAsistencia(null);
    setRating(0);
    setComentario('');
  };

  const enviarCalificacion = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Calificación inválida', 'Por favor selecciona entre 1 y 5 estrellas.');
      return;
    }

    if (!selectedAsistencia || !user) {
      Alert.alert('Error', 'No se pudo enviar la calificación.');
      return;
    }

    const claseId = selectedAsistencia.Clase?.id || selectedAsistencia.claseId;

    if (!claseId) {
      Alert.alert('Error', 'No se pudo identificar la clase.');
      return;
    }

    try {
      setEnviandoCalificacion(true);
      await api.post('/calificaciones', {
        userId: user.id,
        claseId,
        rating,
        comentario: comentario.trim() || null,
      });
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada exitosamente.');
      cerrarModal();
      await loadCalificaciones();
      loadAsistencias(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo enviar la calificación. Intenta nuevamente.'
      );
    } finally {
      setEnviandoCalificacion(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => setRating(num)}
            style={styles.starButton}
          >
            <Ionicons
              name={rating >= num ? 'star' : 'star-outline'}
              size={40}
              color={rating >= num ? '#fbbf24' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {RANGOS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.tabButton, rango === option.key && styles.tabButtonActive]}
            onPress={() => setRango(option.key)}
          >
            <Text style={[styles.tabText, rango === option.key && styles.tabTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {asistencias.length > 0 ? (
        <FlatList
          data={asistencias}
          renderItem={renderAsistencia}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No hay asistencias registradas</Text>
          <Text style={styles.emptySubtext}>Tus clases aparecerán aquí</Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calificar Clase</Text>
              <TouchableOpacity onPress={cerrarModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedAsistencia && (
              <>
                <Text style={styles.modalClaseNombre}>
                  {selectedAsistencia.Clase?.nombre || selectedAsistencia.clase_nombre || 'Clase'}
                </Text>
                <Text style={styles.modalClaseDetalle}>
                  {selectedAsistencia.Clase?.disciplina || 'General'}
                </Text>

                <Text style={styles.modalLabel}>Tu calificación</Text>
                {renderStars()}
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating} {rating === 1 ? 'estrella' : 'estrellas'}
                  </Text>
                )}

                <Text style={styles.modalLabel}>Comentario (opcional)</Text>
                <TextInput
                  style={styles.comentarioInput}
                  placeholder="Escribe tu opinión sobre la clase..."
                  multiline
                  numberOfLines={4}
                  value={comentario}
                  onChangeText={setComentario}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.enviarButton, rating === 0 && styles.enviarButtonDisabled]}
                  onPress={enviarCalificacion}
                  disabled={rating === 0 || enviandoCalificacion}
                >
                  {enviandoCalificacion ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.enviarButtonText}>Enviar Calificación</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HistorialScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabs: {
        flexDirection: 'row',
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#3b82f6',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 10,
    },
    asistenciaCard: {
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    asistenciaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    claseNombre: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        flex: 1,
    },
    badge: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#dbeafe',
        borderRadius: 999,
    },
    asistenciaText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 6,
    },
    qrText: {
        color: '#16a34a',
        fontWeight: '600',
    },
    manualText: {
        color: '#f59e0b',
        fontWeight: '600',
    },
    comentario: {
        fontSize: 13,
        color: '#2c3e50',
        fontStyle: 'italic',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7f8c8d',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bdc3c7',
    },
    calificarButton: {
        marginTop: 10,
        backgroundColor: '#2563eb',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
      },
      calificarButtonText: {
        color: '#fff',
        fontWeight: '600',
      },
      calificacionExpirada: {
        marginTop: 10,
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
      },
    // Estilos de calificación existente
    calificacionContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    calificacionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    calificacionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    calificacionStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    calificacionRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginLeft: 8,
    },
    comentarioContainer: {
        marginTop: 8,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    comentarioLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    comentarioText: {
        fontSize: 13,
        color: '#374151',
        fontStyle: 'italic',
    },
    yaCalificadaContainer: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    yaCalificadaText: {
        color: '#16a34a',
        fontSize: 14,
        fontWeight: '600',
      },
    // Estilos del Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    modalClaseNombre: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    modalClaseDetalle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16,
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    comentarioInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#374151',
        backgroundColor: '#f9fafb',
        minHeight: 100,
        marginBottom: 20,
    },
    enviarButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    enviarButtonDisabled: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },
    enviarButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
