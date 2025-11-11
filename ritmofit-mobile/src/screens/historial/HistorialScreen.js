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
} from 'react-native';
import { getAsistencias } from '../../services/reservaService';

const RANGOS = [
    { key: 'mes', label: 'Último mes', dias: 30 },
    { key: 'trimestre', label: '3 meses', dias: 90 },
    { key: 'todo', label: 'Todo' },
];

export const HistorialScreen = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rango, setRango] = useState('mes');

    useEffect(() => {
        loadAsistencias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const loadAsistencias = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const data = await getAsistencias(buildParams());
            setAsistencias(Array.isArray(data) ? data : []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Error al cargar historial');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderAsistencia = ({ item }) => {
        const clase = item.Clase ?? {};
        const claseNombre = clase.nombre || item.clase_nombre || '—';
        const fechaRaw = item.fecha_asistencia || item.fecha || null;
        const fecha = fechaRaw
            ? new Date(fechaRaw).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
            : '—';
        const sede = clase.Sede?.nombre || item.sede || '—';
        const duracion = item.duracion_minutos || clase.duracion_minutos || '—';
        const disciplina = clase.disciplina || 'General';
        const instructor = clase.instructor?.nombre || 'Profesor asignado';
        const checkInHora = item.checkin_hora || '—';
        const confirmadoQr = item.confirmado_por_qr;

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

    const onRefresh = () => {
        setRefreshing(true);
        loadAsistencias(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                {RANGOS.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.tabButton,
                            rango === option.key && styles.tabButtonActive,
                        ]}
                        onPress={() => setRango(option.key)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                rango === option.key && styles.tabTextActive,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {asistencias.length > 0 ? (
                <FlatList
                    data={asistencias}
                    renderItem={renderAsistencia}
                    keyExtractor={(item, index) => (item.id?.toString() || index.toString())}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No hay asistencias registradas</Text>
                    <Text style={styles.emptySubtext}>Tus clases aparecerán aquí</Text>
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
});
