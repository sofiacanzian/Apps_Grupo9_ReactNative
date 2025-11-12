import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as authService from '../../services/authService';

export const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        if (!email.trim()) {
            Alert.alert('Email requerido', 'Ingresa el correo asociado a tu cuenta.');
            return;
        }

        try {
            setLoading(true);
            await authService.requestPasswordReset(email.trim().toLowerCase());
            Alert.alert('Código enviado', 'Revisa tu email para continuar.', [
                { text: 'Continuar', onPress: () => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() }) },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos iniciar el proceso.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Recuperar contraseña</Text>
                <Text style={styles.subtitle}>Te enviaremos un código OTP para que la restablezcas.</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleRequest} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar código</Text>}
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
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
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
