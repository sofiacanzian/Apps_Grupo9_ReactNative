// screens/main/ProfileScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext'; 
// Opcional: Para el icono del avatar
import Icon from 'react-native-vector-icons/Ionicons'; 

const ProfileScreen = () => {
    // Obtenemos los datos del usuario y la función para cerrar sesión
    const { user, signOut } = useAuth(); 

    // Función auxiliar para capitalizar el rol (ej: 'socio' -> 'Socio')
    const formatRole = (rol) => {
        if (!rol) return '';
        return rol.charAt(0).toUpperCase() + rol.slice(1);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* Icono de Avatar */}
                <View style={styles.avatarContainer}>
                    <Icon name="person-circle-outline" size={100} color="#4CAF50" />
                </View>

                {/* Información del Usuario */}
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{user?.nombre || 'Usuario RitmoFit'}</Text>
                    <Text style={styles.role}>{formatRole(user?.rol)}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                <View style={styles.divider} />

                {/* Sección de Opciones (puede ser ampliada) */}
                <View style={styles.optionsContainer}>
                    <Text style={styles.optionText}>ID de Usuario: {user?.id}</Text>
                    
                    {/* Botón de Cerrar Sesión */}
                    <View style={styles.logoutButton}>
                        <Button
                            title="Cerrar Sesión"
                            onPress={signOut} // Llama a la función del Contexto
                            color="#FF6347" // Rojo para advertencia
                        />
                    </View>
                </View>

                {/* Si es Admin o Instructor, mostrar una nota */}
                {(user?.rol === 'admin' || user?.rol === 'instructor') && (
                    <View style={styles.adminNote}>
                        <Icon name="alert-circle" size={20} color="#FFA500" />
                        <Text style={styles.adminText}>Acceso de gestión activado.</Text>
                    </View>
                )}

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    role: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 20,
    },
    optionsContainer: {
        width: '100%',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logoutButton: {
        marginTop: 40,
        borderRadius: 8,
        overflow: 'hidden',
    },
    adminNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBE6',
        padding: 15,
        borderRadius: 8,
        marginTop: 30,
        borderLeftWidth: 5,
        borderLeftColor: '#FFA500',
    },
    adminText: {
        marginLeft: 10,
        color: '#FFA500',
        fontSize: 14,
    }
});

export default ProfileScreen;