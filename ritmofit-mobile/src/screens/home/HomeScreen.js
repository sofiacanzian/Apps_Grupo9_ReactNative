import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    RefreshControl,
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
    Image,
} from 'react-native';
import { getClases, getSedes } from '../../services/claseService';
import { createReserva } from '../../services/reservaService';
import { scheduleClassReminder } from '../../services/notificationService';
import { getNoticiasDestacadas } from '../../services/noticiasService';
import { useAuthStore } from '../../store/authStore';

const NIVELES = ['principiante', 'intermedio', 'avanzado'];
const DATE_FILTERS = [
    { key: 'todos', label: 'Todas' },
    { key: 'hoy', label: 'Hoy' },
    { key: 'manana', label: 'Mañana' },
    { key: 'semana', label: 'Próx. 7 días' },
];

export const HomeScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const [clases, setClases] = useState([]);
    const [noticias, setNoticias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sedes, setSedes] = useState([]);
    const [selectedSede, setSelectedSede] = useState(null);
    const [nivelFilter, setNivelFilter] = useState(null);
    const [dateFilter, setDateFilter] = useState('todos');
    const [disciplineFilter, setDisciplineFilter] = useState(null);
    const [availableDisciplines, setAvailableDisciplines] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filtersExpanded, setFiltersExpanded] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadData(true);
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSede, nivelFilter, debouncedSearch, dateFilter, disciplineFilter]);

    const toggleFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiltersExpanded((prev) => !prev);
    };

    const toDateParam = (date) => {
        const copy = new Date(date);
        copy.setHours(0, 0, 0, 0);
        return copy.toISOString().split('T')[0];
    };

    const getDateFilterValue = () => {
        if (dateFilter === 'hoy') {
            return toDateParam(new Date());
        }
        if (dateFilter === 'manana') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return toDateParam(tomorrow);
        }
        return null;
    };

    const buildFilters = () => {
        const filtros = {};
        if (selectedSede) filtros.sedeId = selectedSede;
        if (nivelFilter) filtros.nivel = nivelFilter;
        if (debouncedSearch) filtros.q = debouncedSearch;
        if (disciplineFilter) filtros.disciplina = disciplineFilter;
        const fechaFiltro = getDateFilterValue();
        if (fechaFiltro) filtros.fecha = fechaFiltro;
        return filtros;
    };

    const applyWeekFilter = (data) => {
        if (dateFilter !== 'semana') return data;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limitDate = new Date(today);
        limitDate.setDate(limitDate.getDate() + 7);
        return data.filter((clase) => {
            if (!clase.fecha) return true;
            const claseDate = new Date(clase.fecha);
            claseDate.setHours(0, 0, 0, 0);
            return claseDate >= today && claseDate <= limitDate;
        });
    };

    const loadData = async (fetchSedes = false) => {
        try {
            setLoading(true);
            setError(null);
            const filtros = buildFilters();
            const clasesPromise = getClases(filtros);
            const sedesPromise = fetchSedes ? getSedes() : Promise.resolve(sedes);
            const noticiasPromise = getNoticiasDestacadas(3);
            const [clasesData, sedesData, noticiasData] = await Promise.all([clasesPromise, sedesPromise, noticiasPromise]);
            const rawClases = Array.isArray(clasesData) ? clasesData : [];
            const uniqDisciplines = Array.from(new Set(rawClases.map((clase) => clase.disciplina).filter(Boolean)));
            setAvailableDisciplines(uniqDisciplines);
            setClases(applyWeekFilter(rawClases));
            setNoticias(Array.isArray(noticiasData) ? noticiasData : []);
            if (fetchSedes) {
                setSedes(Array.isArray(sedesData) ? sedesData : []);
            }
        } catch (err) {
            setError(err.message);
            Alert.alert('Error', err.message || 'No pudimos cargar las clases');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData(true);
    };

    const activeFiltersCount = [
        selectedSede ? 1 : 0,
        nivelFilter ? 1 : 0,
        disciplineFilter ? 1 : 0,
        dateFilter !== 'todos' ? 1 : 0,
        debouncedSearch ? 1 : 0,
    ].reduce((acc, value) => acc + value, 0);

    const handleReservar = async (claseId, claseNombre) => {
        Alert.alert(
            'Confirmar Reserva',
            `¿Deseas reservar la clase:\n\n${claseNombre}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reservar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const reserva = await createReserva(claseId);
                            await scheduleClassReminder(reserva);
                            Alert.alert('✓ Éxito', 'Tu reserva ha sido confirmada. Te avisaremos 1 hora antes.');
                            loadData();
                        } catch (err) {
                            Alert.alert('✗ Error', err.message || 'No se pudo crear la reserva');
                        }
                    },
                },
            ]
        );
    };

    const openDetalle = (clase) => {
        const params = { claseId: clase.id, clase };
        const parentNavigator = navigation.getParent?.();
        if (parentNavigator?.navigate) {
            parentNavigator.navigate('ClassDetail', params);
        } else if (navigation.navigate) {
            navigation.navigate('ClassDetail', params);
        }
    };

    const openNoticiaDetalle = (noticia) => {
        const parentNavigator = navigation.getParent?.();
        if (parentNavigator?.navigate) {
            parentNavigator.navigate('NoticiaDetalle', { noticia });
        } else if (navigation.navigate) {
            navigation.navigate('NoticiaDetalle', { noticia });
        }
    };

    const openNoticias = () => {
        const parentNavigator = navigation.getParent?.();
        if (parentNavigator?.navigate) {
            parentNavigator.navigate('Noticias');
        } else if (navigation.navigate) {
            navigation.navigate('Noticias');
        }
    };

    const renderNoticiaCarrusel = ({ item }) => {
        const titulo = item.titulo || 'Sin título';
        const descripcion = item.descripcion || '';
        const imagen = item.imagen_url || null;
        const tipo = item.tipo || 'noticia';

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
            <TouchableOpacity
                style={styles.noticiaCarruselCard}
                onPress={() => openNoticiaDetalle(item)}
                activeOpacity={0.85}
            >
                {imagen && (
                    <Image
                        source={{ uri: imagen }}
                        style={styles.noticiaCarruselImagen}
                        resizeMode="cover"
                    />
                )}
                <View style={[styles.noticiaCarruselOverlay, !imagen && styles.noticiaCarruselOverlayNoImg]}>
                    <Text style={styles.noticiaCarruselIcon}>{getIconoTipo(tipo)}</Text>
                    <Text style={styles.noticiaCarruselTitulo} numberOfLines={2}>{titulo}</Text>
                    <Text style={styles.noticiaCarruselDescripcion} numberOfLines={1}>{descripcion}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderClase = ({ item }) => {
        const nombre = item.nombre;
        const hora = item.hora_inicio ?? item.horario_inicio ?? '';
        const instructor = item.instructor?.nombre ?? item.User?.nombre ?? item.profesor ?? '—';
        const sedeNombre = item.Sede?.nombre ?? item.sede ?? '—';
        const cuposDisponibles = item.cupo_disponible ?? item.cupos_disponibles ?? item.cupo_maximo ?? 0;
        const cupoMaximo = item.cupo_maximo ?? item.cupos_totales ?? '—';
        const fecha = item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—';
        const duracion = item.duracion_minutos ? `${item.duracion_minutos} min` : '—';
        const disponible = cuposDisponibles > 0;
        const nivel = item.nivel || 'principiante';
        const disciplina = item.disciplina || 'Entrenamiento';

        return (
            <TouchableOpacity
                style={[styles.claseCard, !disponible && styles.claseCardFull]}
                onPress={() => openDetalle(item)}
                activeOpacity={0.85}
            >
                <View style={styles.claseHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.claseTitulo} numberOfLines={2}>{nombre}</Text>
                        <View style={styles.badgeRow}>
                            <Text style={styles.badge}>{disciplina}</Text>
                            <Text style={styles.nivelBadge}>{nivel}</Text>
                        </View>
                    </View>
                    <Text style={styles.claseHora}>{hora}</Text>
                </View>

                <View style={styles.claseInfoContainer}>
                    <Text style={styles.claseInfo}>📅 {fecha}</Text>
                    <Text style={styles.claseInfo}>⏱️  {duracion}</Text>
                </View>

                <Text style={styles.claseProfesor}>👨‍🏫 {instructor}</Text>
                <Text style={styles.claseSede}>📍 {sedeNombre}</Text>

                <View style={styles.cupoxContainer}>
                    <Text
                        style={[
                            styles.claseCupos,
                            !disponible && styles.cuposLlenos,
                        ]}
                    >
                        🎯 Cupos: {cuposDisponibles}/{cupoMaximo}
                    </Text>
                    {disponible && <Text style={styles.disponibleTag}>✓ Disponible</Text>}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.verDetalleButton}
                        onPress={() => openDetalle(item)}
                    >
                        <Text style={styles.verDetalleText}>Ver detalle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.reservaButton, !disponible && styles.reservaButtonDisabled]}
                        onPress={() => handleReservar(item.id, nombre)}
                        disabled={!disponible}
                    >
                        <Text style={styles.reservaButtonText}>
                            {disponible ? 'Reservar' : 'Cupo Lleno'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Cargando clases...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Catálogo de Clases</Text>
                <Text style={styles.headerSubtitle}>¡Hola, {user?.nombre || 'Socio'}!</Text>
            </View>

            <View style={styles.filterPanel}>
                <View style={styles.filterToggleRow}>
                    <View>
                        <Text style={styles.sectionLabel}>Filtros</Text>
                        <Text style={styles.filterSummary}>
                            {activeFiltersCount ? `${activeFiltersCount} activos` : 'Todos visibles'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.filterToggleButton} onPress={toggleFilters}>
                        <Text style={styles.filterToggleButtonText}>
                            {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                        </Text>
                        <Text style={styles.filterToggleIcon}>{filtersExpanded ? '˄' : '˅'}</Text>
                    </TouchableOpacity>
                </View>

                {filtersExpanded && (
                    <View style={styles.filterCard}>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Busca por disciplina, profesor o clase"
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchQuery('')}>
                                    <Text style={styles.clearSearchText}>×</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.sectionLabel}>Fecha</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterContainer}
                            contentContainerStyle={styles.filterContentContainer}
                        >
                            {DATE_FILTERS.map((filtro) => (
                                <TouchableOpacity
                                    key={filtro.key}
                                    style={[
                                        styles.filterButton,
                                        dateFilter === filtro.key && styles.filterButtonActive,
                                    ]}
                                    onPress={() => setDateFilter(filtro.key)}
                                >
                                    <Text
                                        style={[
                                            styles.filterButtonText,
                                            dateFilter === filtro.key && styles.filterButtonTextActive,
                                        ]}
                                    >
                                        {filtro.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionLabel}>Filtrar por sede</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterContainer}
                            contentContainerStyle={styles.filterContentContainer}
                        >
                            <TouchableOpacity
                                style={[styles.filterButton, !selectedSede && styles.filterButtonActive]}
                                onPress={() => setSelectedSede(null)}
                            >
                                <Text style={[styles.filterButtonText, !selectedSede && styles.filterButtonTextActive]}>
                                    Todas
                                </Text>
                            </TouchableOpacity>
                            {sedes.map((sede) => (
                                <TouchableOpacity
                                    key={sede.id}
                                    style={[styles.filterButton, selectedSede === sede.id && styles.filterButtonActive]}
                                    onPress={() => setSelectedSede(sede.id)}
                                >
                                    <Text
                                        style={[
                                            styles.filterButtonText,
                                            selectedSede === sede.id && styles.filterButtonTextActive,
                                        ]}
                                    >
                                        {sede.nombre}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {availableDisciplines.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>Disciplina</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.filterContainer}
                                    contentContainerStyle={styles.filterContentContainer}
                                >
                                    <TouchableOpacity
                                        style={[styles.filterButton, !disciplineFilter && styles.filterButtonActive]}
                                        onPress={() => setDisciplineFilter(null)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterButtonText,
                                                !disciplineFilter && styles.filterButtonTextActive,
                                            ]}
                                        >
                                            Todas
                                        </Text>
                                    </TouchableOpacity>
                                    {availableDisciplines.map((disciplina) => (
                                        <TouchableOpacity
                                            key={disciplina}
                                            style={[
                                                styles.filterButton,
                                                disciplineFilter === disciplina && styles.filterButtonActive,
                                            ]}
                                            onPress={() =>
                                                setDisciplineFilter(
                                                    disciplineFilter === disciplina ? null : disciplina
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.filterButtonText,
                                                    disciplineFilter === disciplina && styles.filterButtonTextActive,
                                                ]}
                                            >
                                                {disciplina}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Text style={styles.sectionLabel}>Nivel</Text>
                        <View style={styles.nivelContainer}>
                            {NIVELES.map((nivel) => (
                                <TouchableOpacity
                                    key={nivel}
                                    style={[styles.nivelPill, nivelFilter === nivel && styles.nivelPillActive]}
                                    onPress={() => setNivelFilter(nivelFilter === nivel ? null : nivel)}
                                >
                                    <Text style={[styles.nivelPillText, nivelFilter === nivel && styles.nivelPillTextActive]}>
                                        {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {clases.length > 0 ? (
                <FlatList
                    data={clases}
                    renderItem={renderClase}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={
                        noticias.length > 0 && (
                            <View style={styles.noticiasSection}>
                                <View style={styles.noticiasSectionHeader}>
                                    <Text style={styles.noticiasSectionTitle}>📰 Noticias y Promociones</Text>
                                    <TouchableOpacity onPress={openNoticias}>
                                        <Text style={styles.noticiasVerMas}>Ver todas →</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={noticias}
                                    renderItem={renderNoticiaCarrusel}
                                    keyExtractor={(item) => `noticia-${item.id}`}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.noticiasCarruselContainer}
                                    scrollEventThrottle={16}
                                />
                            </View>
                        )
                    }
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
                    <Text style={styles.emptyText}>No encontramos clases con esos filtros</Text>
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
    filterSummary: {
        fontSize: 12,
        color: '#64748b',
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
    searchContainer: {
        marginHorizontal: 8,
        marginBottom: 12,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
    },
    clearSearch: {
        position: 'absolute',
        right: 12,
        top: 10,
        backgroundColor: '#e2e8f0',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearSearchText: {
        fontSize: 18,
        color: '#475569',
        fontWeight: 'bold',
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
    nivelContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    nivelPill: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#cbd5f5',
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    nivelPillActive: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
    },
    nivelPillText: {
        color: '#475569',
    },
    nivelPillTextActive: {
        color: '#1d4ed8',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    claseCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
    },
    claseCardFull: {
        opacity: 0.7,
    },
    claseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    claseTitulo: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    claseHora: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
        flexWrap: 'wrap',
    },
    badge: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '600',
    },
    nivelBadge: {
        backgroundColor: '#fef3c7',
        color: '#b45309',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '600',
    },
    claseInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    claseInfo: {
        fontSize: 14,
        color: '#475569',
    },
    claseProfesor: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
    },
    claseSede: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 12,
    },
    cupoxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    claseCupos: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '600',
    },
    cuposLlenos: {
        color: '#dc2626',
    },
    disponibleTag: {
        color: '#16a34a',
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    verDetalleButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    verDetalleText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    reservaButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    reservaButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    reservaButtonText: {
        color: '#fff',
        fontWeight: '700',
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
    noticiasSection: {
        marginBottom: 24,
    },
    noticiasSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        marginBottom: 12,
    },
    noticiasSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    noticiasVerMas: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: 13,
    },
    noticiasCarruselContainer: {
        paddingHorizontal: 0,
        gap: 12,
    },
    noticiaCarruselCard: {
        width: 280,
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    noticiaCarruselImagen: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    noticiaCarruselOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        padding: 12,
    },
    noticiaCarruselOverlayNoImg: {
        backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        justifyContent: 'center',
    },
    noticiaCarruselIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    noticiaCarruselTitulo: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 18,
    },
    noticiaCarruselDescripcion: {
        fontSize: 12,
        color: '#e0e7ff',
        marginTop: 4,
    },
});
