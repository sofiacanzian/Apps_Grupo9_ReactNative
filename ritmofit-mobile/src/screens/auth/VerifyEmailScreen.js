import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export const VerifyEmailScreen = ({ route }) => {
    const { email } = route.params;
    const setSession = useAuthStore((state) => state.setSession);
    const [otpCode, setOtpCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(900);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleConfirm = async () => {
        if (otpCode.length !== 6) {
            Alert.alert('Código inválido', 'Ingresa los 6 dígitos recibidos por email.');
            return;
        }

        try {
            setLoading(true);
            const { token, user } = await authService.verifyRegistrationOtp({ email, otpCode });
            setSession({ token, user });
            Alert.alert('Cuenta verificada', '¡Bienvenido a RitmoFit!');
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos validar el código.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Verifica tu cuenta</Text>
                <Text style={styles.subtitle}>
                    Ingresá el código enviado a {'\n'}
                    <Text style={styles.bold}>{email}</Text>
                </Text>

                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={setOtpCode}
                />

                <Text style={styles.timerText}>
                    Tiempo restante: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Text>

                <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirmar</Text>}
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
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    bold: {
        fontWeight: '600',
        color: '#111827',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        letterSpacing: 10,
        textAlign: 'center',
        marginBottom: 16,
    },
    timerText: {
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 16,
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
