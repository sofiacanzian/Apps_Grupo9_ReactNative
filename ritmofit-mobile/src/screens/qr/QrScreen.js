import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { registerCheckIn } from '../../services/reservaService';
import { getClaseById } from '../../services/claseService';

const parseQrPayload = (rawData = '') => {
    const data = rawData.trim();
    if (!data) return null;

    try {
        const parsed = JSON.parse(data);
        const claseId = parsed.claseId || parsed.clase_id || parsed.id;
        return {
            claseId,
            claseNombre: parsed.claseNombre || parsed.nombre || 'Clase confirmada',
            horario: parsed.horario || parsed.hora_inicio || '',
        };
    } catch (_err) {
        if (/^\d+$/.test(data)) {
            return { claseId: Number(data) };
        }

        const normalized = data.includes('=') ? data.replace(/^.*?\?/, '') : data;
        const params = new URLSearchParams(normalized);
        const claseId = params.get('claseId') || params.get('clase_id') || params.get('id');
        if (claseId) {
            return { claseId: Number(claseId) };
        }
        return null;
    }
};

export const QrScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (preview || loading || confirming) return;

        const payload = parseQrPayload(data);
        if (!payload?.claseId) {
            Alert.alert('QR inválido', 'No pudimos identificar la clase en el código.');
            return;
        }

        setLoading(true);

        try {
            const clase = await getClaseById(payload.claseId);
            setPreview({
                claseId: payload.claseId,
                claseNombre: clase?.nombre || payload.claseNombre,
                sede: clase?.Sede?.nombre,
                direccion: clase?.Sede?.direccion,
                fecha: clase?.fecha,
                hora: clase?.hora_inicio || payload.horario,
                disciplina: clase?.disciplina,
            });
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos registrar el check-in.');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setPreview(null);
        setConfirming(false);
    };

    const confirmCheckIn = async () => {
        if (!preview?.claseId || confirming) return;
        setConfirming(true);
        try {
            await registerCheckIn(preview.claseId);
            Alert.alert(
                'Check-in confirmado',
                `Clase: ${preview.claseNombre || 'RitmoFit'}${preview.hora ? `\nHora: ${preview.hora}` : ''}`,
                [{ text: 'OK', onPress: resetScanner }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos registrar el check-in.');
            resetScanner();
        } finally {
            setConfirming(false);
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Cargando permisos de cámara...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Necesitamos acceso a tu cámara</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Dar Permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={preview ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />
            <View style={styles.overlay}>
                <View style={styles.scanFrame} />
            </View>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            {preview && (
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>{preview.claseNombre || 'Clase detectada'}</Text>
                    {preview.disciplina ? <Text style={styles.previewText}>{preview.disciplina}</Text> : null}
                    {preview.fecha ? <Text style={styles.previewText}>📅 {new Date(preview.fecha).toLocaleDateString('es-AR')}</Text> : null}
                    {preview.hora ? <Text style={styles.previewText}>🕒 {preview.hora}</Text> : null}
                    {preview.sede ? <Text style={styles.previewText}>📍 {preview.sede}</Text> : null}
                    {preview.direccion ? <Text style={styles.previewSubtext}>{preview.direccion}</Text> : null}
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={resetScanner} disabled={confirming}>
                            <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={confirmCheckIn} disabled={confirming}>
                            {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: '#3b82f6',
        borderRadius: 10,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#fff',
    },
    previewCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 16,
        padding: 16,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    previewText: {
        color: '#e2e8f0',
        marginBottom: 4,
    },
    previewSubtext: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 12,
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3b82f6',
        flex: 1,
    },
    outlineButtonText: {
        color: '#3b82f6',
    },
});
