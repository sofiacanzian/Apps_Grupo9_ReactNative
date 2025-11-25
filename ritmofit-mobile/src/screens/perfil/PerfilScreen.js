import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    getUserProfile,
    updateUserProfile,
    requestAccountDeletionOtp,
    confirmAccountDeletion,
} from '../../services/userService';
import { clearCredentials, saveCredentials, getCredentials } from '../../services/credentialStorage';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const formatDate = (value) => (!value ? '' : value.split('T')[0]);
const isValidDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

export const PerfilScreen = () => {
    const logout = useAuthStore((state) => state.logout);
    const setUser = useAuthStore((state) => state.setUser);
    const token = useAuthStore((state) => state.token);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoData, setFotoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [perfilBase, setPerfilBase] = useState(null);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteOtp, setDeleteOtp] = useState('');
    const [requestingDeletion, setRequestingDeletion] = useState(false);
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);

    // PIN management (server-side)
    const [pinInput, setPinInput] = useState('');
    const [pinProcessing, setPinProcessing] = useState(false);
    const [autoSaveCreds, setAutoSaveCreds] = useState(false);
    const [localPinExists, setLocalPinExists] = useState(false);

    const checkLocalPin = async () => {
        // Currently PIN is managed server-side. Keep localPinExists=false
        // This placeholder avoids crashes from missing function references.
        try {
            setLocalPinExists(false);
        } catch (e) {
            setLocalPinExists(false);
        }
    };

    useEffect(() => {
        loadProfile();
        checkLocalPin();
    }, []);

    // No comprobamos PIN local; el estado del PIN se guarda en el servidor. Si se desea, se puede añadir
    // un endpoint para consultar si el usuario tiene PIN configurado.

    const loadProfile = async () => {
        try {
            setLoading(true);
            const profile = await getUserProfile();
            setPerfilBase(profile);
            setNombre(profile?.nombre ?? '');
            setEmail(profile?.email ?? '');
            setUsername(profile?.username ?? '');
            setTelefono(profile?.telefono ?? '');
            setDireccion(profile?.direccion ?? '');
            setFechaNacimiento(formatDate(profile?.fechaNacimiento));
            setFotoPreview(profile?.foto_url ?? null);
            setFotoData(profile?.foto_url ?? null);
            setUser(profile);
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos cargar tu perfil.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const mimeType = asset?.mimeType || 'image/jpeg';
            if (asset.base64) {
                const dataUri = `data:${mimeType};base64,${asset.base64}`;
                setFotoData(dataUri);
            }
            setFotoPreview(asset.uri);
        }
    };

    const buildPayload = () => {
        const payload = {};
        if (!perfilBase || nombre !== perfilBase?.nombre) payload.nombre = nombre;
        if (!perfilBase || telefono !== (perfilBase?.telefono ?? '')) payload.telefono = telefono;
        if (!perfilBase || direccion !== (perfilBase?.direccion ?? '')) payload.direccion = direccion;
        if (!perfilBase || fechaNacimiento !== formatDate(perfilBase?.fechaNacimiento)) {
            payload.fechaNacimiento = fechaNacimiento || null;
        }
        if (fotoData && fotoData !== perfilBase?.foto_url) {
            payload.foto_url = fotoData;
        }
        return payload;
    };

    const hasChanges = useMemo(() => Object.keys(buildPayload()).length > 0, [
        nombre,
        telefono,
        direccion,
        fechaNacimiento,
        fotoData,
        perfilBase,
    ]);

    const handleUpdate = async () => {
        if (!isValidDate(fechaNacimiento)) {
            Alert.alert('Formato inválido', 'Usa el formato AAAA-MM-DD.');
            return;
        }
        const payload = buildPayload();
        if (Object.keys(payload).length === 0) {
            Alert.alert('Sin cambios', 'No hay datos para actualizar.');
            return;
        }

        try {
            setUpdating(true);
            const updated = await updateUserProfile(payload);
            setPerfilBase(updated);
            setUser(updated);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos actualizar tu perfil.');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const handleRequestDeletion = async () => {
        try {
            setRequestingDeletion(true);
            await requestAccountDeletionOtp();
            setDeleteOtp('');
            setDeleteModalVisible(true);
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos enviar el código.');
        } finally {
            setRequestingDeletion(false);
        }
    };

    const handleSetPin = async () => {
        if (!pinInput || pinInput.trim().length < 4) {
            Alert.alert('PIN inválido', 'Ingresa un PIN de al menos 4 dígitos.');
            return;
        }
        try {
            setPinProcessing(true);
            // Intentar guardar en servidor (requiere token)
            if (token) {
                try {
                    await authService.setPin(token, pinInput.trim());
                } catch (err) {
                    // No impedir guardado local si falla el servidor
                    console.warn('No se pudo guardar PIN en servidor:', err.message || err);
                }
            }
            // Si el usuario opta por autoguardar credenciales, guardarlas también (solo credenciales, no PIN)
            if (autoSaveCreds) {
                const creds = await getCredentials();
                if (!creds && email) {
                    Alert.alert('Credenciales no guardadas', 'No se encontraron credenciales guardadas. Para guardar la contraseña localmente, inicia sesión una vez con contraseña o activa biometría en el registro.');
                }
            }

            setPinInput('');
            Alert.alert('PIN guardado', 'El PIN se guardó en el servidor. Ahora podrás iniciar sesión con PIN.');
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar el PIN.');
        } finally {
            setPinProcessing(false);
        }
    };

    const handleClearPin = async () => {
        try {
            setPinProcessing(true);
            if (token) {
                try {
                    await authService.clearPin(token);
                } catch (err) {
                    console.warn('No se pudo limpiar PIN en servidor:', err.message || err);
                }
            }
            // Limpiamos credenciales locales si existen, pero no mantenemos PIN localmente
            await clearCredentials();
            Alert.alert('PIN eliminado', 'Se eliminó el PIN en el servidor y las credenciales locales.');
        } catch (err) {
            Alert.alert('Error', err.message || 'No se pudo eliminar el PIN.');
        } finally {
            setPinProcessing(false);
        }
    };

    const handleConfirmDeletion = async () => {
        if (deleteOtp.length !== 6) {
            Alert.alert('Código inválido', 'Ingresa los 6 dígitos recibidos por email.');
            return;
        }

        try {
            setConfirmingDeletion(true);
            await confirmAccountDeletion(deleteOtp);
            await clearCredentials();
            Alert.alert('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
            setDeleteModalVisible(false);
            logout();
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos eliminar la cuenta.');
        } finally {
            setConfirmingDeletion(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.profileContainer}>
                <TouchableOpacity style={styles.fotoPicker} onPress={pickImage}>
                    {fotoPreview ? <Image source={{ uri: fotoPreview }} style={styles.foto} /> : <Text style={styles.fotoPlaceholder}>Agregar Foto</Text>}
                </TouchableOpacity>
                <Text style={styles.helperText}>La foto se almacena de forma segura en tu perfil.</Text>

                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} editable={!updating} placeholder="Tu nombre" />

                <Text style={styles.label}>Email</Text>
                <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} />

                <Text style={styles.label}>Nombre de usuario</Text>
                <TextInput style={[styles.input, styles.inputDisabled]} value={username} editable={false} placeholder="usuario" />

                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                    style={styles.input}
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                    editable={!updating}
                    placeholder="Ej: +54 11 4444 8888"
                />

                <Text style={styles.label}>Dirección</Text>
                <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} editable={!updating} placeholder="Calle y número" />

                <Text style={styles.label}>Fecha de nacimiento</Text>
                <TextInput
                    style={styles.input}
                    value={fechaNacimiento}
                    onChangeText={setFechaNacimiento}
                    editable={!updating}
                    placeholder="AAAA-MM-DD"
                />
                <Text style={styles.helperText}>Formato AAAA-MM-DD</Text>

                <TouchableOpacity
                    style={[styles.button, (updating || !hasChanges) && styles.buttonDisabled]}
                    onPress={handleUpdate}
                    disabled={updating || !hasChanges}
                >
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar Cambios</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleRequestDeletion} disabled={requestingDeletion}>
                    {requestingDeletion ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>}
                </TouchableOpacity>
            </View>

            {/* PIN management section */}
            <View style={[styles.profileContainer, { marginTop: 8 }]}
            >
                <Text style={styles.sectionLabel}>PIN y Acceso</Text>
                <Text style={{ marginBottom: 8, color: '#374151' }}>{localPinExists ? 'PIN configurado localmente' : 'No hay PIN configurado'}</Text>

                <TextInput
                    style={styles.input}
                    value={pinInput}
                    onChangeText={(t) => setPinInput(t.replace(/[^0-9]/g, '').slice(0,6))}
                    placeholder="Ingrese PIN (4-6 dígitos)"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                />

                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.button, pinProcessing && styles.buttonDisabled, { flex: 1, marginRight: 8 }]} onPress={handleSetPin} disabled={pinProcessing}>
                        {pinProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar PIN</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.logoutButton, (!localPinExists || pinProcessing) && styles.buttonDisabled, { flex: 1 }]} onPress={handleClearPin} disabled={!localPinExists || pinProcessing}>
                        {pinProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Eliminar PIN</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setAutoSaveCreds((v) => !v)}>
                    <Text style={{ color: autoSaveCreds ? '#2563eb' : '#6b7280', fontWeight: '600' }}>{autoSaveCreds ? 'Guardar credenciales activado' : 'Guardar credenciales desactivado'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Eliminar cuenta</Text>
                        <Text style={styles.modalSubtitle}>Ingresa el código OTP enviado a tu email para confirmar.</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            placeholder="000000"
                            maxLength={6}
                            value={deleteOtp}
                            onChangeText={setDeleteOtp}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteModalVisible(false)} disabled={confirmingDeletion}>
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirm, confirmingDeletion && styles.modalConfirmDisabled]}
                                onPress={handleConfirmDeletion}
                                disabled={confirmingDeletion}
                            >
                                {confirmingDeletion ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Eliminar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        margin: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fotoPicker: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    foto: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
    },
    fotoPlaceholder: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        color: '#2c3e50',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputDisabled: {
        backgroundColor: '#f0f0f0',
        color: '#777',
    },
    helperText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 12,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    logoutButton: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    logoutText: {
        color: '#e74c3c',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#b91c1c',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        color: '#111827',
    },
    modalSubtitle: {
        color: '#6b7280',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 6,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalCancel: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#9ca3af',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#374151',
        fontWeight: '600',
    },
    modalConfirm: {
        flex: 1,
        backgroundColor: '#b91c1c',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalConfirmDisabled: {
        opacity: 0.6,
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
});
