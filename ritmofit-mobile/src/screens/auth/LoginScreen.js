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
import { saveCredentials, getCredentials, clearCredentials, getPinHash, verifyPin } from '../../services/credentialStorage';
import * as authService from '../../services/authService';

export const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error, setSession } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberWithBiometrics, setRememberWithBiometrics] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [storedPinExists, setStoredPinExists] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    const initBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const available = hasHardware && isEnrolled;
        setBiometryAvailable(available);

        const creds = await getCredentials();
        if (creds) {
          setStoredCredentials(creds);
          setIdentifier(creds.identifier);
        }
        const pinHash = await getPinHash();
        if (pinHash) setStoredPinExists(true);
      } catch (err) {
        console.warn('Biometría no disponible:', err);
      }
    };

    initBiometrics();
  }, []);

  // Debounced check server for PIN existence while user types identifier
  const checkServerPinForIdentifier = async (id) => {
    try {
      const trimmed = id?.trim();
      if (!trimmed) {
        setStoredPinExists(false);
        return;
      }
      const res = await authService.checkPinExists(trimmed);
      if (res && res.hasPin) {
        setStoredPinExists(true);
      } else {
        setStoredPinExists(false);
      }
    } catch (err) {
      // ignore network errors for UX
    }
  };

  // Debounce helper
  const debounceRef = React.useRef(null);
  const debouncedCheck = (text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkServerPinForIdentifier(text), 500);
  };


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
        // sesión creada en el store; RootLayout renderizará AppStack
      } else {
        await clearCredentials();
        setStoredCredentials(null);
        // sesión creada en el store; RootLayout renderizará AppStack
      }
  };

  const handleBiometricLogin = async () => {
    if (!biometryAvailable || !storedCredentials) {
      Alert.alert('Biometría no disponible', 'No hay credenciales guardadas.');
      return;
    }

    try {
      setBiometricLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación biométrica o PIN/patrón',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const success = await login({
          identifier: storedCredentials.identifier,
          password: storedCredentials.password,
        });
        if (!success) {
          Alert.alert('Error', useAuthStore.getState().error || 'No se pudo iniciar sesión.');
        }
      } else {
        Alert.alert('Autenticación cancelada', 'No se pudo validar tu identidad.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo usar la autenticación biométrica.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput || pinInput.trim().length < 4) {
      Alert.alert('PIN inválido', 'Ingresa el PIN de 4 dígitos.');
      return;
    }
    setPinLoading(true);
    try {
      // Login EXCLUSIVO server-side con PIN
      const identifierToUse = (identifier && identifier.trim()) || (await getCredentials())?.identifier;
      if (!identifierToUse) {
        Alert.alert('Falta identificador', 'Ingresa tu email/usuario en el campo Usuario o guarda tus credenciales para usar PIN.');
        return;
      }

      const { token, user } = await authService.loginWithPin({ identifier: identifierToUse, pin: pinInput.trim() });
      setSession({ token, user });
      setShowPinModal(false);
      setPinInput('');
      // sesión creada en el store por setSession; RootLayout cambiará a AppStack
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo procesar el PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenido a RitmoFit</Text>
        <Text style={styles.subtitle}>Inicia sesión con tu email o usuario</Text>

        {storedCredentials ? (
          // 🔐 Si hay credenciales guardadas → solo biometría
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
        ) : (
          // 📝 Si no hay credenciales → login normal
          <>
            <Text style={styles.label}>Usuario o Email</Text>
            <TextInput
              style={styles.input}
              placeholder="usuario o correo"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                debouncedCheck(t);
              }}
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
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              )}
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

            {storedPinExists && (
              <TouchableOpacity
                style={[styles.biometricButton, pinLoading && styles.biometricButtonDisabled]}
                onPress={() => setShowPinModal(true)}
                disabled={pinLoading}
              >
                <Text style={styles.biometricButtonText}>Ingresar con PIN</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.divider} />

        {showPinModal && (
          <View style={styles.pinModalOverlay}>
            <View style={styles.pinModalCard}>
              <Text style={{fontWeight:'700',fontSize:18,marginBottom:8}}>Ingresar con PIN</Text>
              <TextInput
                style={styles.input}
                value={pinInput}
                onChangeText={(t) => setPinInput(t.replace(/[^0-9]/g,'').slice(0,6))}
                placeholder="1234"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
              <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8}}>
                <TouchableOpacity style={[styles.secondaryButton,{flex:1,marginRight:8}]} onPress={() => setShowPinModal(false)}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton,{flex:1}]} onPress={handlePinSubmit} disabled={pinLoading}>
                  {pinLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Ingresar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.secondaryButtonText}>Crear cuenta nueva</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f5f7fb' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: '#1f2937' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: '#fff' },
  primaryButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkText: { textAlign: 'center', color: '#2563eb', fontWeight: '600', marginBottom: 16 },
  biometricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  biometricLabel: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  biometricButton: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  biometricButtonDisabled: { opacity: 0.6 },
  biometricButtonText: { color: '#2563eb', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  secondaryButton: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#2563eb', fontWeight: '600' },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
  pinModalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pinModalCard: { width: '90%', backgroundColor: '#fff', padding: 18, borderRadius: 12, elevation: 6 },
});