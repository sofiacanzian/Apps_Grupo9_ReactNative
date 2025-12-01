import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { getReservas, cancelReserva } from '../../services/reservaService';
import { cancelClassReminder } from '../../services/notificationService';

const estadoColors = {
  activa: '#22c55e',
  asistida: '#0ea5e9',
  cancelada: '#ef4444',
  ausente: '#94a3b8',
};

export const ReservasScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await getReservas({ tipo: 'proximas' });
      const reservas = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setItems(reservas);
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleCancelReserva = (reservaId, claseNombre) => {
    Alert.alert(
      'Cancelar Reserva',
      `¿Estás seguro que deseas cancelar la reserva para ${claseNombre}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            try {
              await cancelReserva(reservaId);
              await cancelClassReminder(reservaId);
              Alert.alert('Éxito', 'Reserva cancelada');
              loadItems();
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo cancelar la reserva');
            }
          },
          style: 'destructive',
        },
      ]
    );
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

  const renderItem = ({ item }) => {
    const clase = item.Clase ?? {};
    const claseNombre = clase.nombre || item.clase_nombre || '—';
    const fechaRaw = item.fecha_asistencia || clase.fecha || item.fecha || null;
    const horaRaw = item.checkin_hora || clase.hora_inicio || item.horario || null;
    const fecha = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
      : '—';
    const hora = horaRaw || '—';
    const sede = clase.Sede?.nombre || item.sede || '—';
    const direccion = clase.Sede?.direccion || item.direccion;
    const profesor = clase.instructor?.nombre || clase.User?.nombre || item.profesor || '—';
    const disciplina = clase.disciplina || 'Entrenamiento';
    const estado = item.estado || (item.confirmado_por_qr ? 'asistida' : 'cancelada');

    return (
      <View style={styles.reservaCard}>
        <View style={styles.reservaHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reservaTitulo}>{claseNombre}</Text>
            <Text style={styles.reservaDisciplina}>{disciplina}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColors[estado] || '#3b82f6' }]}>
            <Text style={styles.estadoText}>{estado}</Text>
          </View>
        </View>
        <Text style={styles.reservaText}>📅 {fecha} - {hora}</Text>
        <Text style={styles.reservaText}>📍 {sede}</Text>
        <Text style={styles.reservaText}>👨‍🏫 Prof: {profesor}</Text>

        {direccion && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleOpenMaps(direccion, clase.Sede?.nombre || sede)}
          >
            <Text style={styles.mapButtonText}>📍 Cómo llegar</Text>
          </TouchableOpacity>
        )}

        {estado === 'activa' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelReserva(item.id, claseNombre)}
          >
            <Text style={styles.cancelButtonText}>Cancelar Reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : null}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={items.length === 0 ? styles.emptyStateContainer : styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No tienes reservas próximas</Text>
              <Text style={styles.emptySubtext}>¡Reserva una clase en el catálogo!</Text>
            </View>
          )
        }
      />
    </View>
  );
};

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
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#3b82f6',
    },
    tabText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
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
    emptyStateContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 16,
    },
    reservaCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    reservaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reservaTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    reservaDisciplina: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    estadoBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
    },
    estadoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    reservaText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 6,
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 10,
        borderRadius: 6,
        marginTop: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    mapButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: '#e0f2fe',
      alignSelf: 'flex-start',
    },
    mapButtonText: {
      color: '#0284c7',
      fontWeight: '600',
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
});
