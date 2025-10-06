// navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

// Importar Pantallas
import HomeScreen from '../screens/main/HomeScreen';
import ClasesScreen from '../screens/main/ClasesScreen';
import ReservasScreen from '../screens/main/ReservasScreen';

// (Opcional) Pantalla de Admin/Perfil
import ProfileScreen from '../screens/main/ProfileScreen'; // Necesitas crear este archivo

const Tab = createBottomTabNavigator();

const AppTabs = () => {
    const { isAdmin, isInstructor } = useAuth(); // Usamos los roles del contexto

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Clases') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Reservas') iconName = focused ? 'list-circle' : 'list-circle-outline';
                    else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
                    
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4CAF50', // Verde RitmoFit
                tabBarInactiveTintColor: 'gray',
                headerShown: true, // Mostrar la cabecera
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
            <Tab.Screen name="Clases" component={ClasesScreen} options={{ title: 'Horario' }} />
            <Tab.Screen name="Reservas" component={ReservasScreen} options={{ title: 'Mis Reservas' }} />
            <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />

            {/* Opcional: Si es Admin/Instructor, añadir un panel de administración */}
            {/* { (isAdmin || isInstructor) && (
                <Tab.Screen name="Admin" component={AdminPanelScreen} options={{ title: 'Admin' }} />
            ) } */}
            
        </Tab.Navigator>
    );
};

export default AppTabs;