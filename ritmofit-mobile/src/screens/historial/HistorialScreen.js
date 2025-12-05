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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReservas } from '../../services/reservaService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const buildLocalDate = (fecha, hora = '00:00') => {
  if (!fecha) return null;
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
};

const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return null;
  const normalized = dateTimeStr.trim().replace(' ', 'T');
  const [date, rawTime] = normalized.split('T');
  if (!rawTime) {
    return buildLocalDate(date, '00:00');
  }

  const withoutMillis = rawTime.replace('Z', '').split('.')[0];
  const timeMatch = withoutMillis.match(/^(\d{2}):(\d{2})/);
  const hours = timeMatch ? timeMatch[1] : '00';
  const minutes = timeMatch ? timeMatch[2] : '00';

  return buildLocalDate(date, `${hours}:${minutes}`);
};

const formatExpiryLabel = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
  const [ratingClase, setRatingClase] = useState(0);
  const [ratingInstructor, setRatingInstructor] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [calificaciones, setCalificaciones] = useState({});
  const [pendingCalificaciones, setPendingCalificaciones] = useState({});
  const { user } = useAuthStore();

  useEffect(() => {
    loadHistorial();
  }, [rango]);

  const applyRangoFilter = (reservasList) => {
    const rangoConfig = RANGOS.find((item) => item.key === rango);
    if (!rangoConfig?.dias) return reservasList;

    const fechaCorte = new Date();
    fechaCorte.setDate(fechaCorte.getDate() - rangoConfig.dias);

    return reservasList.filter((reserva) => {
      const fechaInicio = reserva?.fecha_hora_inicio
        ? parseDateTime(reserva.fecha_hora_inicio)
        : reserva?.Clase?.fecha
        ? buildLocalDate(reserva.Clase.fecha, reserva.Clase.hora_inicio)
        : null;
      if (!fechaInicio) return false;
      return fechaInicio >= fechaCorte;
    });
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
            ratingClase: cal.rating,
            ratingInstructor: cal.ratingInstructor,
            comentario: cal.comentario,
          };
        }
      });
      setCalificaciones(calificacionesMap);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
    }
  };

  const loadPendientes = async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(`/calificaciones/user/${user.id}/pending`);
      const pendientesArray = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.data) ? response.data.data : []);

      const pendientesMap = {};
      pendientesArray.forEach((pendiente) => {
        if (pendiente?.claseId) {
          pendientesMap[pendiente.claseId] = pendiente;
        }
      });
      setPendingCalificaciones(pendientesMap);
    } catch (error) {
      console.error('Error al cargar pendientes de calificación:', error);
    }
  };

  const loadHistorial = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await getReservas({ tipo: 'historial' });
      const reservas = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setAsistencias(applyRangoFilter(reservas));
      
      await loadCalificaciones();
      await loadPendientes();
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenMaps = (direccion, sedeNombre) => {
    if (!direccion) {
      Alert.alert('Dirección no disponible', 'No encontramos la dirección de esta sede.');
      return;
    }
    const label = sedeNombre ? `${sedeNombre} ${direccion}` : direccion;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Google Maps.'));
  };

  const renderAsistencia = ({ item }) => {
    const clase = item.Clase ?? {};
    const claseId = clase.id || item.claseId;
    const claseNombre = clase.nombre || item.clase_nombre || '—';
    const fechaInicio = item.fecha_hora_inicio
      ? parseDateTime(item.fecha_hora_inicio)
      : clase.fecha
      ? buildLocalDate(clase.fecha, clase.hora_inicio)
      : null;
    const fecha = fechaInicio
      ? fechaInicio.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : '—';
    const horaInicio = fechaInicio
      ? fechaInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : clase.hora_inicio || '—';
    const sede = clase.Sede?.nombre || item.sede || '—';
    const direccion = clase.Sede?.direccion || item.direccion;
    const duracion = clase.duracion_minutos || item.duracion_minutos || '—';
    const disciplina = clase.disciplina || 'General';
    const instructor = clase.instructor?.nombre || 'Profesor asignado';
    const estado = item.estado || '—';

    const fechaHoraFinClase = item.fecha_hora_fin
      ? parseDateTime(item.fecha_hora_fin)
      : fechaInicio && duracion
      ? new Date(fechaInicio.getTime() + Number(duracion) * 60000)
      : null;

    const ahora = new Date();
    const diferenciaHoras = fechaHoraFinClase
      ? (ahora - fechaHoraFinClase) / (1000 * 60 * 60)
      : Infinity;
    const calificacion = claseId ? calificaciones[claseId] : null;
    const ratingClaseGuardado = calificacion?.ratingClase ?? calificacion?.rating ?? null;
    const ratingInstructorGuardado = calificacion?.ratingInstructor ?? null;
    const yaCalificada = !!calificacion;
    const pendiente = claseId ? pendingCalificaciones[claseId] : null;
    const heuristicaDisponible = estado === 'asistida' && diferenciaHoras > 0 && diferenciaHoras <= 24;
    const puedeCalificar = estado === 'asistida' && (pendiente || heuristicaDisponible);
    const claseTermino = fechaHoraFinClase ? diferenciaHoras > 0 : false;
    const mensajeEstadoCalificacion = !claseTermino && estado === 'asistida'
      ? 'Podrás calificar al finalizar la clase'
      : 'Calificación expirada';
    const puedeAbrirModal = puedeCalificar && !yaCalificada;

    return (
      <View style={styles.asistenciaCard}>
        <View style={styles.asistenciaHeader}>
          <Text style={styles.claseNombre}>{claseNombre}</Text>
          <Text style={styles.badge}>{disciplina}</Text>
        </View>
        <Text style={styles.asistenciaText}>📅 {fecha} · ⏰ {horaInicio}</Text>
        <Text style={styles.asistenciaText}>📍 {sede}</Text>
        <Text style={styles.asistenciaText}>👤 Instructor: {instructor}</Text>
        <Text style={styles.asistenciaText}>⏱️ {duracion} minutos</Text>
        <Text
          style={[
            styles.asistenciaText,
            estado === 'asistida'
              ? styles.qrText
              : estado === 'cancelada'
              ? styles.manualText
              : styles.estadoGenerico,
          ]}
        >
          Estado: {estado}
        </Text>
        {direccion && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleOpenMaps(direccion, clase.Sede?.nombre || sede)}
          >
            <Text style={styles.mapButtonText}>📍 Cómo llegar</Text>
          </TouchableOpacity>
        )}

        {pendiente && !yaCalificada && (
          <Text style={styles.pendienteWindow}>
            Podés calificar hasta {formatExpiryLabel(pendiente.expiresAt)}
          </Text>
        )}
        
        {yaCalificada && (
          <View style={styles.calificacionContainer}>
            <Text style={styles.calificacionLabel}>Tu calificación</Text>
            <View style={styles.calificacionRow}>
              <Text style={styles.calificacionSubLabel}>Clase</Text>
              <View style={styles.calificacionStars}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Ionicons
                    key={num}
                    name={ratingClaseGuardado >= num ? 'star' : 'star-outline'}
                    size={18}
                    color={ratingClaseGuardado >= num ? '#fbbf24' : '#d1d5db'}
                  />
                ))}
                <Text style={styles.calificacionRatingText}>{ratingClaseGuardado ?? '--'}/5</Text>
              </View>
            </View>

            {ratingInstructorGuardado && (
              <View style={styles.calificacionRow}>
                <Text style={styles.calificacionSubLabel}>Profesor</Text>
                <View style={styles.calificacionStars}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Ionicons
                      key={num}
                      name={ratingInstructorGuardado >= num ? 'star' : 'star-outline'}
                      size={18}
                      color={ratingInstructorGuardado >= num ? '#fbbf24' : '#d1d5db'}
                    />
                  ))}
                  <Text style={styles.calificacionRatingText}>{ratingInstructorGuardado}/5</Text>
                </View>
              </View>
            )}

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
          <Text style={styles.calificacionExpirada}>
            {mensajeEstadoCalificacion}
          </Text>
        )}
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistorial(true);
  };

  const abrirModalCalificacion = (asistencia) => {
    setSelectedAsistencia(asistencia);
    setRatingClase(0);
    setRatingInstructor(0);
    setComentario('');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setSelectedAsistencia(null);
    setRatingClase(0);
    setRatingInstructor(0);
    setComentario('');
  };

  const enviarCalificacion = async () => {
    if (ratingClase < 1 || ratingInstructor < 1) {
      Alert.alert('Calificación incompleta', 'Debes calificar la clase y al profesor con 1 a 5 estrellas.');
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
        ratingClase,
        ratingInstructor,
        comentario: comentario.trim() || null,
      });
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada exitosamente.');
      cerrarModal();
      await loadCalificaciones();
      await loadPendientes();
      loadHistorial(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo enviar la calificación. Intenta nuevamente.'
      );
    } finally {
      setEnviandoCalificacion(false);
    }
  };

  const renderStars = (value, onSelect) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((num) => (
        <TouchableOpacity
          key={num}
          onPress={() => onSelect(num)}
          style={styles.starButton}
        >
          <Ionicons
            name={value >= num ? 'star' : 'star-outline'}
            size={40}
            color={value >= num ? '#fbbf24' : '#d1d5db'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

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

                <Text style={styles.modalLabel}>Calificación de la clase</Text>
                {renderStars(ratingClase, setRatingClase)}
                {ratingClase > 0 && (
                  <Text style={styles.ratingText}>
                    {ratingClase} {ratingClase === 1 ? 'estrella' : 'estrellas'}
                  </Text>
                )}

                <Text style={styles.modalLabel}>Calificación del profesor</Text>
                {renderStars(ratingInstructor, setRatingInstructor)}
                {ratingInstructor > 0 && (
                  <Text style={styles.ratingText}>
                    {ratingInstructor} {ratingInstructor === 1 ? 'estrella' : 'estrellas'}
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
                  style={[
                    styles.enviarButton,
                    (ratingClase === 0 || ratingInstructor === 0) && styles.enviarButtonDisabled,
                  ]}
                  onPress={enviarCalificacion}
                  disabled={ratingClase === 0 || ratingInstructor === 0 || enviandoCalificacion}
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
    estadoGenerico: {
      color: '#475569',
      fontWeight: '600',
    },
    mapButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#e0f2fe',
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    mapButtonText: {
      color: '#0284c7',
      fontWeight: '600',
    },
    pendienteWindow: {
      marginTop: 8,
      color: '#475569',
      fontSize: 12,
      fontStyle: 'italic',
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
    calificacionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    calificacionSubLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#475569',
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
