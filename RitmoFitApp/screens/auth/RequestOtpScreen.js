// screens/auth/RequestOtpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext'; 

const RequestOtpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Importamos la función de solicitar OTP que creamos en el contexto
    const { requestOtp } = useAuth(); 

    const handleRequestOtp = async () => {
        if (!email.trim()) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Llama a la función del servicio que se comunica con el backend
            await requestOtp(email.trim()); 
            
            // Si el backend responde OK (código enviado):
            Alert.alert(
                'Código Enviado',
                `Se ha enviado un código de verificación a ${email}. Revísalo en tu correo e ingrésalo en el siguiente paso.`,
                [{ 
                    text: 'OK', 
                    // Navega a la pantalla de validación, pasando el email para pre-cargar el formulario
                    onPress: () => navigation.navigate('LoginOtp', { email: email.trim() }) 
                }]
            );
        } catch (err) {
            // Muestra el error capturado por el servicio (ej: 'Error al enviar el código.')
            setError(err.message || 'Error de conexión. Inténtalo de nuevo.');
            console.error('OTP Request failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Iniciar Sesión / Registrarse</Text>
            <Text style={styles.subtitle}>Ingresa tu email para recibir un código de acceso único.</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            {isLoading ? (
                <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
                <Button 
                    title="Enviar Código de Acceso" 
                    onPress={handleRequestOtp} 
                    color="#4CAF50"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: 'white',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default RequestOtpScreen;