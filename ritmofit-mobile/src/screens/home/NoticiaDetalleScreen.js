import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { getNoticiaDetalle } from '../../services/noticiasService';

export const NoticiaDetalleScreen = ({ route, navigation }) => {
  const { noticia: initialNoticia } = route.params || {};
  const [noticia, setNoticia] = useState(initialNoticia);
  const [loading, setLoading] = useState(!initialNoticia);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialNoticia) {
      loadDetalle();
    }
  }, []);

  const loadDetalle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNoticiaDetalle(initialNoticia?.id);
      setNoticia(data);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message || 'No se pudo cargar la noticia');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${noticia?.titulo}\n\n${noticia?.descripcion}\n\n¡Entérate en RitmoFit!`,
        title: noticia?.titulo,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir');
    }
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!noticia) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se encontró la noticia</Text>
      </View>
    );
  }

  const tipo = noticia.tipo || 'noticia';
  const titulo = noticia.titulo || 'Sin título';
  const descripcion = noticia.descripcion || '';
  const contenido = noticia.contenido || '';
  const imagen = noticia.imagen_url || null;
  const fecha = noticia.fecha_publicacion ? new Date(noticia.fecha_publicacion).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Fecha no disponible';
  const autor = noticia.autor || 'RitmoFit';
  const vigente = noticia.vigente !== false;

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'promocion':
        return '🎉';
      case 'evento':
        return '📅';
      case 'noticia':
      default:
        return '📰';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {imagen && (
          <Image
            source={{ uri: imagen }}
            style={styles.headerImagen}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View style={styles.tipoAndTitulo}>
              <View style={styles.tipoBadge}>
                <Text style={styles.tipoIcon}>{getIconoTipo(tipo)}</Text>
                <Text style={styles.tipoBadgeText}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
              </View>
              {noticia.destacada && <Text style={styles.destacadaBadge}>⭐ Destacada</Text>}
            </View>

            <Text style={styles.titulo}>{titulo}</Text>

            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>📅 {fecha}</Text>
              <Text style={styles.metaText}>✍️ {autor}</Text>
              {!vigente && <Text style={styles.expiradoTag}>Expirada</Text>}
            </View>
          </View>

          {descripcion && (
            <Text style={styles.descripcion}>{descripcion}</Text>
          )}

          {contenido && (
            <View style={styles.contenidoContainer}>
              <Text style={styles.contenidoText}>{contenido}</Text>
            </View>
          )}

          {noticia.enlace && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleOpenLink(noticia.enlace)}
            >
              <Text style={styles.linkButtonText}>Ver enlace completo</Text>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          )}

          {noticia.ubicacion && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>📍 Ubicación</Text>
              <Text style={styles.infoText}>{noticia.ubicacion}</Text>
            </View>
          )}

          {noticia.fecha_evento && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>🕐 Fecha del Evento</Text>
              <Text style={styles.infoText}>
                {new Date(noticia.fecha_evento).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {noticia.fecha_vencimiento && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>⏰ Válido hasta</Text>
              <Text style={styles.infoText}>
                {new Date(noticia.fecha_vencimiento).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {noticia.codigo_promocion && (
            <View style={[styles.infoBox, styles.codigoPromoBox]}>
              <Text style={styles.infoLabel}>🎁 Código de Promoción</Text>
              <View style={styles.codigoContainer}>
                <Text style={styles.codigoText}>{noticia.codigo_promocion}</Text>
                <TouchableOpacity style={styles.copiarButton}>
                  <Text style={styles.copiarButtonText}>Copiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>📤 Compartir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerImagen: {
    width: '100%',
    height: 240,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerInfo: {
    marginBottom: 24,
  },
  tipoAndTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipoIcon: {
    fontSize: 14,
  },
  tipoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  destacadaBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    lineHeight: 36,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  expiradoTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  descripcion: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  contenidoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  contenidoText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  linkButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  linkArrow: {
    color: '#fff',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  codigoPromoBox: {
    borderLeftColor: '#f59e0b',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  codigoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  codigoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b45309',
    letterSpacing: 2,
  },
  copiarButton: {
    backgroundColor: '#b45309',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copiarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 14,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
});
