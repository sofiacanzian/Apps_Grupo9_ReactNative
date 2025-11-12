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

const parseQrPayload = (rawData) => {
    try {
        const parsed = JSON.parse(rawData);
        const claseId = parsed.claseId || parsed.clase_id || parsed.id;
        return {
            claseId,
            claseNombre: parsed.claseNombre || parsed.nombre || 'Clase confirmada',
            horario: parsed.horario || parsed.hora_inicio || '',
        };
    } catch (_err) {
        if (/^\d+$/.test(rawData)) {
            return { claseId: Number(rawData) };
        }
        return null;
    }
};

export const QrScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned || loading) return;

        const payload = parseQrPayload(data);
        if (!payload?.claseId) {
            Alert.alert('QR inválido', 'No pudimos identificar la clase en el código.');
            return;
        }

        setScanned(true);
        setLoading(true);

        try {
            await registerCheckIn(payload.claseId);

            Alert.alert(
                'Check-in confirmado',
                `Clase: ${payload.claseNombre ?? 'RitmoFit'}${payload.horario ? `\nHora: ${payload.horario}` : ''}`,
                [{ text: 'OK', onPress: () => setScanned(false) }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'No pudimos registrar el check-in.');
            setScanned(false);
        } finally {
            setLoading(false);
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
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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

            {scanned && (
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.buttonText}>Escanear de Nuevo</Text>
                    </TouchableOpacity>
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
    bottomContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
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
});
