// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// Importar Contexto y Componentes
import { AuthProvider, useAuth } from './context/AuthContext'; 

// --- Componentes de Pantalla (Crearemos estos archivos después) ---
// Pantallas de Autenticación
import RequestOtpScreen from './screens/auth/RequestOtpScreen'; 
import LoginOtpScreen from './screens/auth/LoginOtpScreen'; 

// Pantallas Principales
// El componente principal que maneja la navegación logueada (Home, Clases, Perfil)
import AppTabs from './navigation/AppTabs'; 

const Stack = createNativeStackNavigator();

// -----------------------------------------------------------
// 1. Navegador de Autenticación (Login, OTP)
// -----------------------------------------------------------
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RequestOtp" component={RequestOtpScreen} />
        <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />
    </Stack.Navigator>
);

// -----------------------------------------------------------
// 2. Componente Principal que decide qué mostrar
// -----------------------------------------------------------
const RootNavigator = () => {
    const { userToken, isLoading } = useAuth();

    if (isLoading) {
        // Muestra un indicador de carga mientras verifica la sesión
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {userToken ? (
                // Si el usuario tiene un token, muestra las pestañas principales (Home)
                <AppTabs />
            ) : (
                // Si no está logueado, muestra las pantallas de Autenticación
                <AuthStack />
            )}
        </NavigationContainer>
    );
};


// -----------------------------------------------------------
// 3. Componente Raíz que provee el Contexto
// -----------------------------------------------------------
const App = () => (
    <AuthProvider>
        <RootNavigator />
    </AuthProvider>
);

export default App;