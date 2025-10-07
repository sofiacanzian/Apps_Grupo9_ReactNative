// screens/main/ClasesScreen.js (Implementación CRUD de Lectura/Reserva)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { fetchClases, createReserva } from '../../services/clase.service'; 
import { useAuth } from '../../context/AuthContext';

const ClaseItem = ({ clase, onReserve }) => {
    const { user } = useAuth();
    // Determinar si el usuario logueado es el instructor de esta clase (opcional)
    const isInstructor = user.id === clase.instructorId;
    
    return (
        <View style={styles.card}>
            <Text style={styles.claseTitle}>{clase.nombre}</Text>
            <Text>Día: {clase.dia} | Hora: {clase.hora_inicio.substring(0, 5)}</Text>
            <Text>Sede: {clase.Sede.nombre}</Text>
            <Text>Instructor: {clase.User.nombre}</Text>
            <Text>Cupo: {clase.cupo_maximo}</Text>
            
            {user.rol === 'socio' && ( // Solo los socios pueden reservar
                <Button 
                    title="Reservar Clase"
                    onPress={() => onReserve(clase.id, clase.nombre)}
                    color="#007AFF" // Azul
                />
            )}
            {isInstructor && <Text style={{ color: 'orange', marginTop: 5 }}>Eres el instructor de esta clase.</Text>}
        </View>
    );
};

const ClasesScreen = () => {
    const [clases, setClases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadClases = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Carga todas las clases disponibles
            const data = await fetchClases();
            setClases(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClases();
    }, [loadClases]);

    const handleReserve = async (claseId, claseNombre) => {
        Alert.alert(
            "Confirmar Reserva",
            `¿Estás seguro de que quieres reservar ${claseNombre}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Reservar", 
                    onPress: async () => {
                        try {
                            // 1. Llama al servicio para crear la reserva
                            await createReserva(claseId);
                            
                            // 2. Muestra éxito y refresca la lista (para ver cupos)
                            Alert.alert("¡Éxito!", `Has reservado ${claseNombre} exitosamente.`);
                            // Opcional: Se debería refrescar la lista de clases aquí si quieres actualizar el contador de cupos
                            // loadClases(); 
                        } catch (err) {
                            Alert.alert("Error de Reserva", err.message);
                        }
                    } 
                }
            ]
        );
    };

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>;
    }

    if (error) {
        return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <FlatList
            data={clases}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ClaseItem clase={item} onReserve={handleReserve} />}
            contentContainerStyle={{ padding: 10 }}
        />
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    errorText: { color: 'red' },
});

export default ClasesScreen;