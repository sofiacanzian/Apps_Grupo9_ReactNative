import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../../store/authStore';
import { saveCredentials, getCredentials, clearCredentials } from '../../services/credentialStorage';

export const LoginScreen = ({ navigation }) => {
    const { login, isLoading, error } = useAuthStore();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberWithBiometrics, setRememberWithBiometrics] = useState(false);
    const [biometryAvailable, setBiometryAvailable] = useState(false);
    const [storedCredentials, setStoredCredentials] = useState(null);
    const [biometricLoading, setBiometricLoading] = useState(false);

    useEffect(() => {
        const initBiometrics = async () => {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                const available = hasHardware && isEnrolled;
                setBiometryAvailable(available);
                setRememberWithBiometrics(available);

                const creds = await getCredentials();
                if (creds) {
                    setStoredCredentials(creds);
                    if (!identifier) {
                        setIdentifier(creds.identifier);
                    }
                }
            } catch (err) {
                console.warn('Biometría no disponible:', err);
            }
        };

        initBiometrics();
    }, []);

    const handleSubmit = async () => {
        if (!identifier.trim() || !password) {
            Alert.alert('Campos incompletos', 'Ingresa tu email/usuario y contraseña.');
            return;
        }
        const trimmedIdentifier = identifier.trim();
        const success = await login({ identifier: trimmedIdentifier, password });
        if (!success) {
            Alert.alert('Error', useAuthStore.getState().error || 'No se pudo iniciar sesión.');
        } else if (biometryAvailable && rememberWithBiometrics) {
            await saveCredentials({ identifier: trimmedIdentifier, password });
            setStoredCredentials({ identifier: trimmedIdentifier, password });
        } else {
            await clearCredentials();
            setStoredCredentials(null);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometryAvailable || !storedCredentials) {
            Alert.alert('Biometría no disponible', 'Activa las credenciales biométricas luego de un inicio de sesión exitoso.');
            return;
        }

        try {
            setBiometricLoading(true);
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autenticación biométrica',
                cancelLabel: 'Cancelar',
            });
            if (!result.success) {
                if (result.error) {
                    Alert.alert('Biometría cancelada', 'No se pudo validar tu identidad.');
                }
                return;
            }

            const success = await login({
                identifier: storedCredentials.identifier,
                password: storedCredentials.password,
            });
            if (!success) {
                Alert.alert('Error', useAuthStore.getState().error || 'No se pudo iniciar sesión.');
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'No se pudo usar la autenticación biométrica.');
        } finally {
            setBiometricLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Bienvenido a RitmoFit</Text>
                <Text style={styles.subtitle}>Inicia sesión con tu email o usuario</Text>

                <Text style={styles.label}>Usuario o Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="usuario o correo"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={identifier}
                    onChangeText={setIdentifier}
                />

                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                {biometryAvailable && (
                    <View style={styles.biometricRow}>
                        <Text style={styles.biometricLabel}>Recordar para biometría</Text>
                        <Switch
                            value={rememberWithBiometrics}
                            onValueChange={setRememberWithBiometrics}
                            thumbColor={rememberWithBiometrics ? '#2563eb' : '#e5e5e5'}
                        />
                    </View>
                )}

                {biometryAvailable && storedCredentials && (
                    <TouchableOpacity
                        style={[styles.biometricButton, biometricLoading && styles.biometricButtonDisabled]}
                        onPress={handleBiometricLogin}
                        disabled={biometricLoading}
                    >
                        {biometricLoading ? (
                            <ActivityIndicator color="#1f2937" />
                        ) : (
                            <Text style={styles.biometricButtonText}>Ingresar con biometría</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.secondaryButtonText}>Crear cuenta nueva</Text>
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
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 24,
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
        marginBottom: 12,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    linkText: {
        textAlign: 'center',
        color: '#2563eb',
        fontWeight: '600',
        marginBottom: 16,
    },
    biometricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    biometricLabel: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    biometricButton: {
        borderWidth: 1,
        borderColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    biometricButtonDisabled: {
        opacity: 0.6,
    },
    biometricButtonText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    errorText: {
        color: '#dc2626',
        marginBottom: 12,
        textAlign: 'center',
    },
});
