import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as authService from '../../services/authService';

export const RegisterScreen = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!nombre.trim() || !email.trim() || !password || !passwordConfirm) {
            Alert.alert('Campos incompletos', 'Completa los campos obligatorios.');
            return;
        }
        if (password !== passwordConfirm) {
            Alert.alert('Contraseñas distintas', 'Verifica que las contraseñas coincidan.');
            return;
        }

        try {
            setLoading(true);
            await authService.register({
                nombre: nombre.trim(),
                email: email.trim().toLowerCase(),
                telefono: telefono.trim() || undefined,
                username: username.trim() || undefined,
                password,
                confirmPassword: passwordConfirm,
            });

            Alert.alert(
                'Confirma tu email',
                'Te enviamos un código OTP para finalizar el registro.',
                [
                    {
                        text: 'Ingresar código',
                        onPress: () => navigation.navigate('VerifyEmail', { email: email.trim().toLowerCase() }),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('No pudimos registrar la cuenta', error.message || 'Revisa los datos e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Completa los datos para acceder a RitmoFit</Text>

                <Text style={styles.label}>Nombre completo *</Text>
                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Lucía Fernández" />

                <Text style={styles.label}>Nombre de usuario</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="lucia.fit"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Email *</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                    style={styles.input}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="+54 11 ..."
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Contraseña *</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                />

                <Text style={styles.label}>Confirmar contraseña *</Text>
                <TextInput
                    style={styles.input}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    placeholder="••••••••"
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Registrarme</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Ya tengo cuenta</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
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
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
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
        backgroundColor: '#fff',
        fontSize: 15,
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
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
        color: '#2563eb',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
});
