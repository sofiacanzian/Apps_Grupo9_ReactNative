import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { getClaseById } from '../../services/claseService';
import { createReserva } from '../../services/reservaService';
import { scheduleClassReminder } from '../../services/notificationService';

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    return `${hour}:${minute}`;
};

export const ClassDetailScreen = ({ route }) => {
    const { claseId, clase: claseParam } = route.params ?? {};
    const [clase, setClase] = useState(claseParam ?? null);
    const [loading, setLoading] = useState(!claseParam);
    const [reserving, setReserving] = useState(false);
    const [error, setError] = useState(null);

    const loadClase = useCallback(async () => {
        if (!claseId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getClaseById(claseId);
            setClase(data);
        } catch (err) {
            setError(err.message || 'No se pudo cargar la clase');
        } finally {
            setLoading(false);
        }
    }, [claseId]);

    useEffect(() => {
        if (!clase && claseId) {
            loadClase();
        }
    }, [clase, claseId, loadClase]);

    const handleReservar = async () => {
        if (!clase) return;
        setReserving(true);
        try {
            const reserva = await createReserva(clase.id);
            await scheduleClassReminder(reserva);
            Alert.alert('Reserva confirmada', 'Te recordaremos 1 hora antes del inicio.');
            await loadClase();
        } catch (err) {
            Alert.alert('Error', err.message || 'No se pudo crear la reserva.');
        } finally {
            setReserving(false);
        }
    };

    if (loading || !clase) {
        return (
            <View style={styles.center}>
                {loading ? <ActivityIndicator size="large" color="#3b82f6" /> : <Text style={styles.error}>{error || 'Clase no encontrada'}</Text>}
            </View>
        );
    }

    const disponible = clase.cupo_disponible > 0;
    const sede = clase.Sede;
    const instructor = clase.instructor;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{clase.nombre}</Text>
                <Text style={styles.subtitle}>{clase.disciplina} · Nivel {clase.nivel}</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>📅 {formatDate(clase.fecha)}</Text>
                    <Text style={styles.infoText}>🕒 {formatTime(clase.hora_inicio)}</Text>
                </View>
                <Text style={styles.infoText}>⏱️ {clase.duracion_minutos} minutos</Text>
                {clase.descripcion ? <Text style={styles.description}>{clase.descripcion}</Text> : null}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructor</Text>
                    <Text style={styles.infoText}>{instructor?.nombre ?? 'Sin asignar'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sede</Text>
                    <Text style={styles.infoText}>{sede?.nombre}</Text>
                    <Text style={styles.infoText}>{sede?.direccion}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cupos</Text>
                    <Text style={[styles.cupoText, !disponible && styles.cupoLleno]}>
                        {clase.cupo_disponible} disponibles de {clase.cupo_maximo}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, (!disponible || reserving) && styles.buttonDisabled]}
                onPress={handleReservar}
                disabled={!disponible || reserving}
            >
                {reserving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{disponible ? 'Reservar clase' : 'Cupo completo'}</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#4b5563',
        marginTop: 12,
        lineHeight: 20,
    },
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#1f2937',
    },
    cupoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981',
    },
    cupoLleno: {
        color: '#ef4444',
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: '#ef4444',
    },
});
