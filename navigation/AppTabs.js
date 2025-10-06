// navigation/AppTabs.js
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Este componente representará el NavigationContainer con las pestañas (Tab Navigator)
const AppTabs = () => {
    const { signOut, user } = useAuth();
    
    // Aquí iría el Tab.Navigator (ej: Home, Clases, Reservas, AdminPanel)
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>¡Bienvenido, {user.nombre || 'Socio'}!</Text>
            <Text>Rol: {user.rol}</Text>
            <Button title="Cerrar Sesión" onPress={signOut} />
        </View>
    );
};

export default AppTabs;