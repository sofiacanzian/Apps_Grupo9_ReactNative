// screens/main/ReservasScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { fetchMisReservas, cancelReserva } from '../../services/clase.service'; 
import { useAuth } from '../../context/AuthContext';

// -----------------------------------------------------------------
// Componente para renderizar una única Reserva
// -----------------------------------------------------------------
const ReservaItem = ({ reserva, onCancel }) => {
    // La reserva incluye los datos de la Clase y la Sede, gracias al 'include' del backend
    const clase = reserva.Clase; 
    
    return (
        <View style={styles.card}>
            <Text style={styles.claseTitle}>{clase.nombre}</Text>
            <Text>Día: {clase.dia} | Hora: {clase.hora_inicio.substring(0, 5)}</Text>
            <Text>Sede: {clase.Sede.nombre}</Text>
            <Text style={styles.reservaDate}>Reservado el: {new Date(reserva.createdAt).toLocaleDateString()}</Text>
            
            <View style={styles.buttonContainer}>
                <Button 
                    title="Cancelar Reserva"
                    onPress={() => onCancel(reserva.id, clase.nombre)}
                    color="#FF6347" // Rojo para cancelar
                />
            </View>
        </View>
    );
};

// -----------------------------------------------------------------
// Componente principal de Mis Reservas
// -----------------------------------------------------------------
const ReservasScreen = () => {
    const [reservas, setReservas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadReservas = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Llama al servicio para obtener solo las reservas del usuario logueado
            const data = await fetchMisReservas();
            setReservas(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadReservas();
    }, [loadReservas]);

    const handleCancel = async (reservaId, claseNombre) => {
        Alert.alert(
            "Confirmar Cancelación",
            `¿Estás seguro de que quieres cancelar tu reserva para ${claseNombre}? Esta acción no se puede deshacer.`,
            [
                { text: "No, Mantener", style: "cancel" },
                { 
                    text: "Sí, Cancelar", 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelReserva(reservaId);
                            Alert.alert("Cancelada", `Tu reserva para ${claseNombre} ha sido cancelada.`);
                            
                            // Refrescar la lista de reservas
                            loadReservas();
                        } catch (err) {
                            Alert.alert("Error", err.message);
                        }
                    } 
                }
            ]
        );
    };

    if (isLoading && !isRefreshing) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>;
    }

    if (error) {
        return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
    }
    
    if (reservas.length === 0 && !isLoading) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Aún no tienes ninguna reserva activa. ¡Reserva una clase!</Text>
                <Button title="Recargar" onPress={loadReservas} color="#4CAF50" />
            </View>
        );
    }

    return (
        <FlatList
            data={reservas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ReservaItem reserva={item} onCancel={handleCancel} />}
            contentContainerStyle={{ padding: 10 }}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadReservas(); }} />
            }
        />
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    claseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    reservaDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 10,
    },
    errorText: { 
        color: 'red', 
        marginBottom: 10 
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        color: '#666',
    }
});

export default ReservasScreen;