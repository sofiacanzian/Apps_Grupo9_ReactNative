import React, { useState, useEffect } from 'react';
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
import { saveCredentials } from '../../services/credentialStorage';
import { savePin } from '../../services/credentialStorage';
import * as LocalAuthentication from 'expo-local-authentication';

export const RegisterScreen = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState('');
    const [enableBiometrics, setEnableBiometrics] = useState(false);
    const [biometryAvailable, setBiometryAvailable] = useState(false);

        useEffect(() => {
            const checkBio = async () => {
                try {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                    setBiometryAvailable(hasHardware && isEnrolled);
                } catch (err) {
                    setBiometryAvailable(false);
                }
            };
            checkBio();
        }, []);

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
            // Enviamos opcionalmente el PIN al backend para que el login por PIN pueda funcionar server-side
            await authService.register({
                nombre: nombre.trim(),
                email: email.trim().toLowerCase(),
                telefono: telefono.trim() || undefined,
                username: username.trim() || undefined,
                password,
                confirmPassword: passwordConfirm,
                ...(pin && pin.trim().length >= 4 ? { pin: pin.trim() } : {}),
            });

            // Si se solicitó PIN, lo enviamos al backend (server-side PIN). No guardamos PIN localmente por seguridad.
            // Si el usuario activó biometría guardamos las credenciales para facilitar login biométrico.
            if (enableBiometrics) {
                await saveCredentials({ identifier: email.trim().toLowerCase(), password });
            }

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

                <Text style={styles.label}>PIN (4 dígitos, opcional)</Text>
                <TextInput
                    style={styles.input}
                    value={pin}
                    onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0,6))}
                    placeholder="1234"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                />

                {biometryAvailable && (
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                        <Text style={{fontSize:14,color:'#1f2937',fontWeight:'500'}}>Habilitar biometría</Text>
                        <TouchableOpacity onPress={() => setEnableBiometrics(!enableBiometrics)}>
                            <Text style={{color: enableBiometrics ? '#2563eb' : '#999', fontWeight:'600'}}>{enableBiometrics ? 'Sí' : 'No'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
