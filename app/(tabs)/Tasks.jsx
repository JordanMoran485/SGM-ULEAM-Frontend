import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomSearchBar } from '../../src/components/CustomSearchBar';
import { useAppContext } from '../../src/context/AppContext';
import { useToast } from '../../src/components/Toast';

const FILTERS = [
  { key: 'all',         label: 'Todas' },
  { key: 'pending',     label: 'Pendientes' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'completed',   label: 'Completadas' },
];


function getStatusConfig(status) {
  if (status === 'completed')   return { stripe: '#22C55E', bg: '#DCFCE7', color: '#16A34A', label: 'Completada' };
  if (status === 'in_progress') return { stripe: '#4A6CF7', bg: '#E8EDFF', color: '#2D3FE0', label: 'En progreso' };
  return { stripe: '#F59E0B', bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' };
}

function firstRole(user) {
  if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
  return user?.role || user?.cargo || null;
}

function isTaskForCurrentUser(item, user) {
  if (!user) return false;
  const fullName    = [user.name, user.lastname].filter(Boolean).join(' ').trim().toUpperCase();
  const assignedName = (item.assignedCleanerName || '').trim().toUpperCase();
  return (
    String(item.userId || '') === String(user.id || '') ||
    (fullName && assignedName && fullName === assignedName)
  );
}

function formatTaskDate(item) {
  const raw = item?.startAt || item?.dueDate || item?.createdAt;
  if (!raw) return 'Sin fecha';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  const diff = (Date.now() - parsed.getTime()) / 1000;
  if (diff < 60)    return 'Ahora';
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(parsed);
}

function useSkeletonOpacity() {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonCard({ opacity }) {
  return (
    <View style={[styles.card, { paddingLeft: 20 }]}>
      <Animated.View style={[skStyles.stripe, { opacity }]} />
      <Animated.View style={[skStyles.iconBox, { opacity }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Animated.View style={[skStyles.titleBar, { opacity }]} />
          <Animated.View style={[skStyles.timeBar, { opacity }]} />
        </View>
        <Animated.View style={[skStyles.locationBar, { opacity }]} />
        <Animated.View style={[skStyles.tagPill, { opacity }]} />
      </View>
      <Animated.View style={[skStyles.chevron, { opacity }]} />
    </View>
  );
}

function TaskSkeletonScreen({ isConserje }) {
  const opacity = useSkeletonOpacity();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero con shimmer */}
      <LinearGradient
        colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
        <View style={styles.heroRow}>
          <View style={{ gap: 10 }}>
            <Animated.View style={[skStyles.eyebrowBar, { opacity }]} />
            <Animated.View style={[skStyles.titleHeroBar, { opacity }]} />
          </View>
          <Animated.View style={[skStyles.heroBadgeBox, { opacity }]} />
        </View>
      </LinearGradient>

      {/* Search skeleton */}
      <View style={styles.searchWrapper}>
        <Animated.View style={[skStyles.searchBar, { opacity }]} />
      </View>

      {/* Tabs skeleton */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow} style={styles.tabsScroll}>
        {[80, 106, 110, 118].map((w, i) => (
          <Animated.View key={i} style={[skStyles.tabPill, { width: w, backgroundColor: i === 0 ? '#C7D2FE' : '#E8EDFF', opacity }]} />
        ))}
      </ScrollView>

      {/* Encabezado lista skeleton */}
      <View style={[styles.listHeader, { marginTop: 16 }]}>
        <Animated.View style={[skStyles.listTitleBar, { opacity }]} />
        <Animated.View style={[skStyles.listCountBox, { opacity }]} />
      </View>

      {/* Cards skeleton */}
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} opacity={opacity} />)}
    </ScrollView>
  );
}

function StatusTab({ label, active, count, onPress }) {
  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.tabWrapper}>
        <LinearGradient
          colors={['#2D3FE0', '#4A6CF7']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.tabActive}
        >
          <Text style={styles.tabActiveText}>{label}</Text>
          {count !== undefined && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{count}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.tabWrapper, styles.tabInactive]}>
      <Text style={styles.tabInactiveText}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.tabBadgeInactive}>
          <Text style={styles.tabBadgeInactiveText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}


export default function TasksScreen() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing]     = useState(false);

  const router = useRouter();
  const toast = useToast();
  const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();
  const isConserje = firstRole(user) === 'conserje';

  useEffect(() => {
    if (!tasksLoaded) {
      refreshTasks().catch((err) =>
        toast.error('Error al cargar tareas', err?.message || 'No se pudieron cargar las tareas.')
      );
    }
  }, [tasksLoaded, refreshTasks]);

  const counts = useMemo(() => {
    const scoped = isConserje ? tasks.filter((t) => isTaskForCurrentUser(t, user)) : tasks;
    const result = { all: scoped.length, pending: 0, in_progress: 0, completed: 0 };
    scoped.forEach((t) => {
      if (result[t.status] !== undefined) result[t.status] += 1;
    });
    return result;
  }, [isConserje, tasks, user]);

  const visibleTasks = useMemo(() => {
    const scoped = isConserje ? tasks.filter((t) => isTaskForCurrentUser(t, user)) : tasks;
    const query  = search.trim().toUpperCase();
    return scoped
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t) => {
        if (!query) return true;
        return [t.title, t.description, t.location, t.assignedCleanerName, t.priority]
          .filter(Boolean).join(' ').toUpperCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [isConserje, search, statusFilter, tasks, user]);

  const refreshScreen = async () => {
    setRefreshing(true);
    try { await refreshTasks(); }
    catch (err) { toast.error('Error', err?.message || 'No se pudieron actualizar las tareas.'); }
    finally { setRefreshing(false); }
  };

  const screenTitle = isConserje ? 'Mis tareas' : 'Tareas asignadas';

  if (!tasksLoaded) return <TaskSkeletonScreen isConserje={isConserje} />;

  const ListHeader = (
    <>
      {/* ── Hero ── */}
      <LinearGradient
        colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        {/* Fila superior */}
        <View style={{ position: 'absolute', top: 18, left: '8%', transform: [{ rotate: '-10deg' }] }}>
          <MaterialCommunityIcons name="broom" size={44} color="rgba(255,255,255,0.08)" />
        </View>
        <View style={{ position: 'absolute', top: 10, left: '40%', transform: [{ rotate: '14deg' }] }}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="rgba(255,255,255,0.08)" />
        </View>
        <View style={{ position: 'absolute', top: 20, right: '10%', transform: [{ rotate: '-16deg' }] }}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={50} color="rgba(255,255,255,0.07)" />
        </View>

        {/* Fila inferior */}
        <View style={{ position: 'absolute', bottom: 14, left: '6%', transform: [{ rotate: '18deg' }] }}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={56} color="rgba(255,255,255,0.07)" />
        </View>
        <View style={{ position: 'absolute', bottom: 10, left: '42%', transform: [{ rotate: '-8deg' }] }}>
          <MaterialCommunityIcons name="brush" size={52} color="rgba(255,255,255,0.07)" />
        </View>
        <View style={{ position: 'absolute', bottom: -28, right: -18, transform: [{ rotate: '15deg' }] }}>
          <MaterialCommunityIcons name="clipboard-edit-outline" size={148} color="rgba(255,255,255,0.07)" />
        </View>

        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroEyebrow}>Trabajo asignado</Text>
            <Text style={styles.heroTitle}>{screenTitle}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNum}>{counts.all}</Text>
            <Text style={styles.heroBadgeLabel}>tareas</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Buscador ── */}
      <View style={styles.searchWrapper}>
        <CustomSearchBar
          onChangeText={setSearch}
          value={search}
          placeholder="Buscar por tarea, ubicación o prioridad"
        />
      </View>

      {/* ── Filtros de estado ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {FILTERS.map((f) => (
          <StatusTab
            key={f.key}
            label={f.label}
            active={statusFilter === f.key}
            count={f.key === 'all' ? counts.all : counts[f.key]}
            onPress={() => setStatusFilter(f.key)}
          />
        ))}
      </ScrollView>

      {/* ── Encabezado lista ── */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Bandeja de tareas</Text>
        <View style={styles.listCountPill}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={13} color="#4A6CF7" />
          <Text style={styles.listCountText}>{visibleTasks.length}</Text>
        </View>
      </View>

      {search.trim() !== '' && (
        <Text style={styles.resultsCount}>
          {visibleTasks.length} resultado{visibleTasks.length !== 1 ? 's' : ''}
        </Text>
      )}
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={visibleTasks}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={refreshScreen}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => {
        const sc = getStatusConfig(item.status);
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'task' } })}
          >
            <View style={[styles.stripe, { backgroundColor: sc.stripe }]} />
            <View style={[styles.cardIconBox, { backgroundColor: sc.bg }]}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={sc.color} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardTime}>{formatTaskDate(item)}</Text>
              </View>
              {item.location && (
                <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
              )}
              <View style={styles.cardTags}>
                <View style={[styles.cardTag, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.cardTagText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C7D2FE" />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <LinearGradient
            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.emptyDecoCard}
          >
            <View style={styles.emptyDecoCircle} />
            <MaterialCommunityIcons name="clipboard-check-outline" size={36} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Sin tareas asignadas</Text>
          <Text style={styles.emptyText}>
            Cuando un supervisor te asigne una tarea, aparecerá aquí.
          </Text>
          {statusFilter !== 'all' && (
            <TouchableOpacity onPress={() => setStatusFilter('all')} activeOpacity={0.85} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  content:   { paddingBottom: 48 },

  // Hero
  hero: {
    paddingTop: 72,
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decCircle2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff', fontSize: 28, fontWeight: '800',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  heroBadgeNum:   { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  heroBadgeLabel: { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600' },

  // Search
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },

  // Tabs
  tabsScroll: { marginTop: 12 },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  tabWrapper: { borderRadius: 999, overflow: 'hidden' },
  tabActive: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
  },
  tabActiveText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  tabInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 9,
    shadowColor: '#4A6CF7', shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  tabInactiveText: { color: '#8F95B2', fontSize: 13, fontWeight: '600' },
  tabBadgeInactive: {
    backgroundColor: '#E8EDFF', borderRadius: 999,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabBadgeInactiveText: { color: '#4A6CF7', fontSize: 10, fontWeight: '700' },

  // Encabezado lista
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 4,
  },
  listTitle: { color: '#1A1F36', fontSize: 17, fontWeight: '700' },
  listCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8EDFF', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  listCountText: { color: '#4A6CF7', fontSize: 13, fontWeight: '800' },

  // Contador de búsqueda
  resultsCount: {
    color: '#8F95B2', fontSize: 12, fontWeight: '500',
    paddingHorizontal: 24, marginTop: 4, marginBottom: 4,
  },

  // Card de tarea
  card: {
    position: 'relative',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 20,
    marginHorizontal: 20, marginTop: 12,
    padding: 16, paddingLeft: 20,
    overflow: 'hidden',
    shadowColor: '#4A6CF7', shadowOpacity: 0.09,
    shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  stripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  cardIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo:   { flex: 1, minWidth: 0, gap: 4 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle:  { flex: 1, color: '#1A1F36', fontSize: 14, fontWeight: '800' },
  cardTime:   { color: '#8F95B2', fontSize: 10, fontWeight: '500', marginLeft: 8, flexShrink: 0 },
  cardLocation: { color: '#8F95B2', fontSize: 12, fontWeight: '500' },
  cardTags:   { flexDirection: 'row', gap: 6, marginTop: 2 },
  cardTag:    { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  cardTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Empty state
  emptyWrapper: {
    alignItems: 'center', paddingHorizontal: 32, paddingTop: 48, gap: 16,
  },
  emptyDecoCard: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8,
    shadowColor: '#2D3FE0', shadowOpacity: 0.25,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  emptyDecoCircle: {
    position: 'absolute', top: -20, right: -20,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyTitle: { color: '#1A1F36', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyText:  { color: '#8F95B2', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyAction: {
    backgroundColor: '#E8EDFF', borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  emptyActionText: { color: '#4A6CF7', fontSize: 13, fontWeight: '700' },
});

const skStyles = StyleSheet.create({
  // Hero shimmer
  eyebrowBar:   { width: 120, height: 12, borderRadius: 6,  backgroundColor: 'rgba(255,255,255,0.30)' },
  titleHeroBar: { width: 180, height: 28, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.30)' },
  heroBadgeBox: { width: 72,  height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.20)' },
  // Search
  searchBar:    { height: 48, borderRadius: 16, backgroundColor: '#C7D2FE' },
  // Tabs
  tabPill:      { height: 38, borderRadius: 999 },
  // List header
  listTitleBar: { width: 150, height: 18, borderRadius: 6,  backgroundColor: '#C7D2FE' },
  listCountBox: { width: 52,  height: 30, borderRadius: 999, backgroundColor: '#E8EDFF' },
  // Card
  stripe:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#C7D2FE' },
  iconBox:      { width: 48,  height: 48, borderRadius: 14, backgroundColor: '#E8EDFF', flexShrink: 0 },
  titleBar:     { width: '62%', height: 14, borderRadius: 6,  backgroundColor: '#C7D2FE' },
  timeBar:      { width: 36,   height: 10, borderRadius: 4,  backgroundColor: '#E8EDFF' },
  locationBar:  { width: '45%', height: 11, borderRadius: 5,  backgroundColor: '#E8EDFF' },
  tagPill:      { width: 72,   height: 22, borderRadius: 999, backgroundColor: '#E8EDFF' },
  chevron:      { width: 22,   height: 22, borderRadius: 6,  backgroundColor: '#E8EDFF' },
});
