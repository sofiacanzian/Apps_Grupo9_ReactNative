import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as authService from '../../services/authService';

export const ResetPasswordScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!otpCode || otpCode.length !== 6) {
            Alert.alert('Código inválido', 'Ingresa los 6 dígitos recibidos por email.');
            return;
        }
        if (!password || password !== passwordConfirm) {
            Alert.alert('Contraseñas distintas', 'Asegúrate de que las contraseñas coincidan.');
            return;
        }

        try {
            setLoading(true);
            await authService.confirmPasswordReset({
                email,
                otpCode,
                password,
                confirmPassword: passwordConfirm,
            });
            Alert.alert('Contraseña actualizada', 'Ya podés iniciar sesión con tu nueva contraseña.', [
                { text: 'Ir al login', onPress: () => navigation.navigate('Login') },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>Email: {email}</Text>

                <Text style={styles.label}>Código OTP</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChangeText={setOtpCode}
                />

                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                />

                <Text style={styles.label}>Confirmar contraseña</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Actualizar contraseña</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f5f7fb',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
