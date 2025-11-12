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
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tipo, setTipo] = useState('proximas');

    useEffect(() => {
        loadReservas();
    }, [tipo]);

    const loadReservas = async () => {
        try {
            if (!refreshing) {
                setLoading(true);
            }
            const data = await getReservas({ tipo });
            const lista = Array.isArray(data) ? data : [];
            setReservas(lista);
        } catch (error) {
            Alert.alert('Error', error.message || 'Error al cargar reservas');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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
                            loadReservas();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'No se pudo cancelar la reserva');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadReservas();
    };

    const renderReserva = ({ item }) => {
        const clase = item.Clase ?? {};
        const claseNombre = clase.nombre || item.clase_nombre || '—';
        const fechaBase = clase.fecha || item.fecha || null;
        const horaBase = clase.hora_inicio || item.horario || null;
        const startDate = item.fecha_hora_inicio ? new Date(item.fecha_hora_inicio) :
            (fechaBase && horaBase ? new Date(`${fechaBase}T${horaBase}`) : null);
        const fecha = startDate && !Number.isNaN(startDate.getTime())
            ? startDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
            : fechaBase || '—';
        const hora = startDate && !Number.isNaN(startDate.getTime())
            ? startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : horaBase || '—';
        const sede = clase.Sede?.nombre || item.sede || '—';
        const profesor = clase.instructor?.nombre || clase.User?.nombre || item.profesor || '—';
        const disciplina = clase.disciplina || 'Entrenamiento';

        return (
            <View style={styles.reservaCard}>
                <View style={styles.reservaHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.reservaTitulo}>{claseNombre}</Text>
                        <Text style={styles.reservaDisciplina}>{disciplina}</Text>
                    </View>
                    <View
                        style={[
                            styles.estadoBadge,
                            { backgroundColor: estadoColors[item.estado] || '#3b82f6' },
                        ]}
                    >
                        <Text style={styles.estadoText}>{item.estado || 'Pendiente'}</Text>
                    </View>
                </View>
                <Text style={styles.reservaText}>📅 {fecha} - {hora}</Text>
                <Text style={styles.reservaText}>📍 {sede}</Text>
                <Text style={styles.reservaText}>👨‍🏫 Prof: {profesor}</Text>

                {item.estado === 'activa' && tipo === 'proximas' && (
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
                <TouchableOpacity
                    style={[styles.tabButton, tipo === 'proximas' && styles.tabButtonActive]}
                    onPress={() => setTipo('proximas')}
                >
                    <Text style={[styles.tabText, tipo === 'proximas' && styles.tabTextActive]}>Próximas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, tipo === 'historial' && styles.tabButtonActive]}
                    onPress={() => setTipo('historial')}
                >
                    <Text style={[styles.tabText, tipo === 'historial' && styles.tabTextActive]}>Historial</Text>
                </TouchableOpacity>
            </View>

            {reservas.length > 0 ? (
                <FlatList
                    data={reservas}
                    renderItem={renderReserva}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>
                        {tipo === 'proximas' ? 'No tienes reservas próximas' : 'No hay reservas en tu historial'}
                    </Text>
                    {tipo === 'proximas' && <Text style={styles.emptySubtext}>¡Reserva una clase en el catálogo!</Text>}
                </View>
            )}
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
