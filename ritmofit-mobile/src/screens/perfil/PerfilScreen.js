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
import {
    getObjetivos,
    createObjetivo,
    updateObjetivo,
    deleteObjetivo,
} from '../../services/objetivoService';
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

    // Estados para objetivos
    const [objetivos, setObjetivos] = useState([]);
    const [loadingObjetivos, setLoadingObjetivos] = useState(false);
    const [objetivoModalVisible, setObjetivoModalVisible] = useState(false);
    const [editingObjetivo, setEditingObjetivo] = useState(null);
    const [cantidadClases, setCantidadClases] = useState('');
    const [disciplina, setDisciplina] = useState('');
    const [duracionPeriodo, setDuracionPeriodo] = useState('');
    const [savingObjetivo, setSavingObjetivo] = useState(false);

    useEffect(() => {
        loadProfile();
        loadObjetivos();
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

    // Funciones para objetivos
    const loadObjetivos = async () => {
        try {
            setLoadingObjetivos(true);
            const data = await getObjetivos();
            setObjetivos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando objetivos:', error);
        } finally {
            setLoadingObjetivos(false);
        }
    };

    const abrirModalObjetivo = (objetivo = null) => {
        if (objetivo) {
            setEditingObjetivo(objetivo);
            setCantidadClases(objetivo.cantidad_clases.toString());
            setDisciplina(objetivo.disciplina);
            setDuracionPeriodo(objetivo.duracion_periodo);
        } else {
            setEditingObjetivo(null);
            setCantidadClases('');
            setDisciplina('');
            setDuracionPeriodo('');
        }
        setObjetivoModalVisible(true);
    };

    const cerrarModalObjetivo = () => {
        setObjetivoModalVisible(false);
        setEditingObjetivo(null);
        setCantidadClases('');
        setDisciplina('');
        setDuracionPeriodo('');
    };

    const handleSaveObjetivo = async () => {
        if (!cantidadClases || !disciplina || !duracionPeriodo) {
            Alert.alert('Campos incompletos', 'Completa todos los campos.');
            return;
        }

        const cantidad = parseInt(cantidadClases);
        if (isNaN(cantidad) || cantidad < 1) {
            Alert.alert('Cantidad inválida', 'Ingresa un número válido de clases.');
            return;
        }

        try {
            setSavingObjetivo(true);
            if (editingObjetivo) {
                await updateObjetivo(editingObjetivo.id, {
                    cantidad_clases: cantidad,
                    disciplina,
                    duracion_periodo: duracionPeriodo,
                });
                Alert.alert('Éxito', 'Objetivo actualizado correctamente.');
            } else {
                await createObjetivo({
                    cantidad_clases: cantidad,
                    disciplina,
                    duracion_periodo: duracionPeriodo,
                });
                Alert.alert('Éxito', 'Objetivo creado correctamente.');
            }
            cerrarModalObjetivo();
            loadObjetivos();
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar el objetivo.');
        } finally {
            setSavingObjetivo(false);
        }
    };

    const handleDeleteObjetivo = (objetivo) => {
        Alert.alert(
            'Eliminar objetivo',
            `¿Estás seguro de que deseas eliminar este objetivo?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteObjetivo(objetivo.id);
                            Alert.alert('Éxito', 'Objetivo eliminado correctamente.');
                            loadObjetivos();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar el objetivo.');
                        }
                    },
                },
            ]
        );
    };

    const getProgressColor = (porcentaje, completado) => {
        if (completado) return '#16a34a'; // Verde cuando está completo
        if (porcentaje >= 80) return '#fbbf24'; // Amarillo cuando está cerca
        return '#3b82f6'; // Azul normal
    };

    const disciplinas = ['Box', 'Pilates', 'Spinning', 'CrossFit', 'Zumba', 'Yoga'];
    const periodos = ['semana', 'mes', '6 meses', '12 meses'];

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

            {/* Sección de Objetivos */}
            <View style={styles.objetivosContainer}>
                <View style={styles.objetivosHeader}>
                    <Text style={styles.objetivosTitle}>Objetivos</Text>
                    <TouchableOpacity
                        style={styles.addObjetivoButton}
                        onPress={() => abrirModalObjetivo()}
                    >
                        <Text style={styles.addObjetivoText}>+ Nuevo</Text>
                    </TouchableOpacity>
                </View>

                {loadingObjetivos ? (
                    <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
                ) : objetivos.length === 0 ? (
                    <Text style={styles.emptyObjetivosText}>No tienes objetivos aún. ¡Crea uno para comenzar!</Text>
                ) : (
                    objetivos.map((objetivo) => {
                        const progreso = objetivo.progreso || { clasesAsistidas: 0, clasesObjetivo: objetivo.cantidad_clases, porcentaje: 0, completado: false };
                        const porcentaje = progreso.porcentaje || 0;
                        const completado = progreso.completado || false;
                        const color = getProgressColor(porcentaje, completado);
                        const fechaFin = new Date(objetivo.fecha_fin);
                        const diasRestantes = Math.ceil((fechaFin - new Date()) / (1000 * 60 * 60 * 24));

                        const faltantes = (objetivo.cantidad_clases || 0) - (progreso.clasesAsistidas || 0);
                        const nearComplete = !completado && faltantes > 0 && faltantes <= 2;

                        return (
                            <View key={objetivo.id} style={[styles.objetivoCard, nearComplete && styles.nearCompleteGlow]}>
                                <View style={styles.objetivoHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.objetivoDisciplina}>{objetivo.disciplina}</Text>
                                        <Text style={styles.objetivoMeta}>
                                            Ir a {objetivo.cantidad_clases} clases durante {objetivo.duracion_periodo}
                                        </Text>
                                        {diasRestantes > 0 && (
                                            <Text style={styles.objetivoDiasRestantes}>
                                                {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restantes
                                            </Text>
                                        )}
                                        {nearComplete && (
                                            <View style={styles.casiBadge}>
                                                <Text style={styles.casiBadgeText}>Casi! solo falt{faltantes === 1 ? 'a' : 'an'} {faltantes} </Text>
                                            </View>
                                        )}
                                    </View>
                                    {completado && (
                                        <View style={styles.completadoBadge}>
                                            <Text style={styles.completadoText}>Completado!</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${Math.min(100, porcentaje)}%`, backgroundColor: color },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {progreso.clasesAsistidas} de {progreso.clasesObjetivo} clases ({porcentaje}%)
                                    </Text>
                                </View>

                                <View style={styles.objetivoActions}>
                                    <TouchableOpacity
                                        style={styles.editObjetivoButton}
                                        onPress={() => abrirModalObjetivo(objetivo)}
                                    >
                                        <Text style={styles.editObjetivoText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteObjetivoButton}
                                        onPress={() => handleDeleteObjetivo(objetivo)}
                                    >
                                        <Text style={styles.deleteObjetivoText}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Modal para crear/editar objetivo */}
            <Modal
                visible={objetivoModalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModalObjetivo}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {editingObjetivo ? 'Editar Objetivo' : 'Nuevo Objetivo'}
                        </Text>

                        <Text style={styles.label}>Ir a</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Cantidad de clases"
                            value={cantidadClases}
                            onChangeText={setCantidadClases}
                        />

                        <Text style={styles.label}>Clases de</Text>
                        <View style={styles.selectContainer}>
                            {disciplinas.map((disc) => (
                                <TouchableOpacity
                                    key={disc}
                                    style={[
                                        styles.selectOption,
                                        disciplina === disc && styles.selectOptionActive,
                                    ]}
                                    onPress={() => setDisciplina(disc)}
                                >
                                    <Text
                                        style={[
                                            styles.selectOptionText,
                                            disciplina === disc && styles.selectOptionTextActive,
                                        ]}
                                    >
                                        {disc}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Durante</Text>
                        <View style={styles.selectContainer}>
                            {periodos.map((periodo) => (
                                <TouchableOpacity
                                    key={periodo}
                                    style={[
                                        styles.selectOption,
                                        duracionPeriodo === periodo && styles.selectOptionActive,
                                    ]}
                                    onPress={() => setDuracionPeriodo(periodo)}
                                >
                                    <Text
                                        style={[
                                            styles.selectOptionText,
                                            duracionPeriodo === periodo && styles.selectOptionTextActive,
                                        ]}
                                    >
                                        {periodo}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={cerrarModalObjetivo}
                                disabled={savingObjetivo}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBlue, savingObjetivo && styles.modalConfirmDisabled]}
                                onPress={handleSaveObjetivo}
                                disabled={savingObjetivo}
                            >
                                {savingObjetivo ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    modalConfirmBlue: {
        flex: 1,
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    modalConfirmDisabled: {
        opacity: 0.6,
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },
    objetivosContainer: {
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
    objetivosHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    objetivosTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50',
    },
    addObjetivoButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addObjetivoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyObjetivosText: {
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: 14,
        marginVertical: 20,
    },
    objetivoCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    objetivoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    objetivoDisciplina: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    objetivoMeta: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    objetivoDiasRestantes: {
        fontSize: 12,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    completadoBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completadoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
        transition: 'width 0.3s ease',
    },
    progressText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center',
    },
    objetivoActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editObjetivoButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    editObjetivoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    deleteObjetivoButton: {
        flex: 1,
        backgroundColor: '#ef4444',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    deleteObjetivoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    selectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    selectOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    selectOptionActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    selectOptionText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    selectOptionTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    nearCompleteGlow: {
        borderColor: '#f59e0b',
        borderWidth: 2,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 5,
    },
    casiBadge: {
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#f59e0b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    casiBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
});
