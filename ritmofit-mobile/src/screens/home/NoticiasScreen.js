import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { getNoticias, getNoticiasDestacadas, getPromociones, getEventos, marcarNoticiaLeida } from '../../services/noticiasService';

const TIPO_FILTERS = [
  { key: 'todos', label: 'Todas' },
  { key: 'noticia', label: 'Noticias' },
  { key: 'promocion', label: 'Promociones' },
  { key: 'evento', label: 'Eventos' },
];

export const NoticiasScreen = ({ navigation }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNoticias(true);
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    loadNoticias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFilter]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded((prev) => !prev);
  };

  const loadNoticias = async (fetchAll = false) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (tipoFilter === 'todos') {
        response = await getNoticias();
      } else if (tipoFilter === 'promocion') {
        response = await getPromociones();
      } else if (tipoFilter === 'evento') {
        response = await getEventos();
      } else {
        response = await getNoticias({ tipo: tipoFilter });
      }

      // Ordenar por fecha de publicación descendente
      const sorted = (Array.isArray(response) ? response : []).sort((a, b) => {
        const fechaA = new Date(a.fecha_publicacion || 0);
        const fechaB = new Date(b.fecha_publicacion || 0);
        return fechaB - fechaA;
      });

      setNoticias(sorted);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message || 'No se pudieron cargar las noticias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNoticias(true);
  };

  const handleNoticiaPress = (noticia) => {
    // Marcar como leída (sin esperar respuesta)
    marcarNoticiaLeida(noticia.id).catch(() => {});

    // Abrir detalle
    const params = { noticia };
    const parentNavigator = navigation.getParent?.();
    if (parentNavigator?.navigate) {
      parentNavigator.navigate('NoticiaDetalle', params);
    } else if (navigation.navigate) {
      navigation.navigate('NoticiaDetalle', params);
    }
  };

  const filteredNoticias = noticias.filter((noticia) => {
    const titulo = noticia.titulo?.toLowerCase() || '';
    const descripcion = noticia.descripcion?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return titulo.includes(query) || descripcion.includes(query);
  });

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

  const formatDate = (fechaStr) => {
    if (!fechaStr) return 'Fecha no disponible';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  const renderNoticia = ({ item }) => {
    const tipo = item.tipo || 'noticia';
    const titulo = item.titulo || 'Sin título';
    const descripcion = item.descripcion || '';
    const imagen = item.imagen_url || null;
    const fecha = formatDate(item.fecha_publicacion);
    const vigente = item.vigente !== false; // Por defecto vigente
    const destacada = item.destacada === true;

    return (
      <TouchableOpacity
        style={[styles.noticiaCard, !vigente && styles.noticiaCardExpired, destacada && styles.noticiaCardHighlight]}
        onPress={() => handleNoticiaPress(item)}
        activeOpacity={0.85}
      >
        {imagen && (
          <Image
            source={{ uri: imagen }}
            style={styles.noticiaImagen}
            resizeMode="cover"
          />
        )}

        <View style={styles.noticiaContent}>
          <View style={styles.noticiaHeader}>
            <View style={styles.tipoBadgeContainer}>
              <Text style={styles.tipoIcon}>{getIconoTipo(tipo)}</Text>
              <Text style={styles.tipoBadge}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
            </View>
            {destacada && <Text style={styles.destacadaBadge}>⭐ Destacada</Text>}
          </View>

          <Text style={styles.noticiaTitulo} numberOfLines={2}>
            {titulo}
          </Text>

          {descripcion && (
            <Text style={styles.noticiaDescripcion} numberOfLines={2}>
              {descripcion}
            </Text>
          )}

          <View style={styles.noticiaFooter}>
            <Text style={styles.noticiaFecha}>📅 {fecha}</Text>
            {!vigente && <Text style={styles.expiradoTag}>Expirada</Text>}
          </View>

          {item.enlace && (
            <TouchableOpacity
              style={styles.enlaceButton}
              onPress={(e) => {
                e.stopPropagation();
                Linking.openURL(item.enlace).catch(() =>
                  Alert.alert('Error', 'No se pudo abrir el enlace')
                );
              }}
            >
              <Text style={styles.enlaceButtonText}>Ver más →</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando noticias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Noticias y Promociones</Text>
        <Text style={styles.headerSubtitle}>Entérate de las novedades de RitmoFit</Text>
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.filterToggleRow}>
          <Text style={styles.sectionLabel}>Filtros</Text>
          <TouchableOpacity style={styles.filterToggleButton} onPress={toggleFilters}>
            <Text style={styles.filterToggleButtonText}>
              {filtersExpanded ? 'Ocultar' : 'Mostrar'}
            </Text>
            <Text style={styles.filterToggleIcon}>{filtersExpanded ? '˄' : '˅'}</Text>
          </TouchableOpacity>
        </View>

        {filtersExpanded && (
          <View style={styles.filterCard}>
            <Text style={styles.sectionLabel}>Tipo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContentContainer}
            >
              {TIPO_FILTERS.map((filtro) => (
                <TouchableOpacity
                  key={filtro.key}
                  style={[
                    styles.filterButton,
                    tipoFilter === filtro.key && styles.filterButtonActive,
                  ]}
                  onPress={() => setTipoFilter(filtro.key)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      tipoFilter === filtro.key && styles.filterButtonTextActive,
                    ]}
                  >
                    {filtro.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {filteredNoticias.length > 0 ? (
        <FlatList
          data={filteredNoticias}
          renderItem={renderNoticia}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay noticias en esta categoría</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
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
    paddingHorizontal: 20,
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
  },
  filterToggleButtonText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  filterToggleIcon: {
    marginLeft: 4,
    fontSize: 16,
    color: '#1f2937',
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  filterContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  noticiaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticiaCardHighlight: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: '#fefce8',
  },
  noticiaCardExpired: {
    opacity: 0.6,
  },
  noticiaImagen: {
    width: 100,
    height: 100,
  },
  noticiaContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoIcon: {
    fontSize: 12,
  },
  tipoBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  destacadaBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noticiaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  noticiaDescripcion: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  noticiaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticiaFecha: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expiradoTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enlaceButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enlaceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  cardArrow: {
    fontSize: 24,
    color: '#cbd5e1',
    marginRight: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#dc2626',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
});
