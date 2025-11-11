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
import { clearCredentials } from '../../services/credentialStorage';
import { useAuthStore } from '../../store/authStore';

const formatDate = (value) => (!value ? '' : value.split('T')[0]);
const isValidDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

export const PerfilScreen = () => {
    const logout = useAuthStore((state) => state.logout);
    const setUser = useAuthStore((state) => state.setUser);

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

    useEffect(() => {
        loadProfile();
    }, []);

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
});
