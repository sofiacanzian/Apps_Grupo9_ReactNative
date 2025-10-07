// screens/auth/LoginOtpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext'; 

const LoginOtpScreen = ({ route, navigation }) => {
    // 1. Obtener el email de los parámetros de la navegación
    const { email } = route.params; 
    
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Importamos la función signIn del contexto para establecer la sesión
    const { signIn } = useAuth(); 

    const handleLogin = async () => {
        if (otpCode.length !== 6) {
            setError('El código debe tener 6 dígitos.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Llama a la función del contexto para loguear (que llama a auth.service)
            const result = await signIn(email, otpCode); 
            
            if (result.success) {
                // Si es exitoso, el AuthContext ya actualizó userToken y el App.js navega a AppTabs.
                Alert.alert("¡Bienvenido!", "Has iniciado sesión exitosamente.");
            } else {
                // Si el backend devuelve un error (código expirado/inválido)
                setError(result.error || 'Código OTP inválido. Vuelve a intentarlo.');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión. Inténtalo de nuevo.');
            console.error('Login failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verifica tu Email</Text>
            <Text style={styles.subtitle}>
                Ingresa el código de 6 dígitos que enviamos a <Text style={{ fontWeight: 'bold' }}>{email}</Text>.
            </Text>
            
            <TextInput
                style={styles.input}
                placeholder="Código de 6 dígitos"
                keyboardType="numeric"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                editable={!isLoading}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            {isLoading ? (
                <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
                <Button 
                    title="Iniciar Sesión" 
                    onPress={handleLogin} 
                    color="#4CAF50"
                />
            )}
            
            <View style={styles.resendContainer}>
                <Text>¿No recibiste el código?</Text>
                <Button 
                    title="Reenviar Código" 
                    onPress={() => navigation.navigate('RequestOtp')}
                    color="#0000FF" 
                />
            </View>
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
        fontSize: 18,
        textAlign: 'center', // Centra el código OTP
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    resendContainer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});

export default LoginOtpScreen;