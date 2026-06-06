import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomSearchBar } from '../../src/components/CustomSearchBar';
import { useAppContext } from '../../src/context/AppContext';

const FILTERS = [
  { key: 'all',         label: 'Todas' },
  { key: 'pending',     label: 'Pendientes' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'completed',   label: 'Completadas' },
];

function getStatusConfig(status) {
  if (status === 'completed')  return { stripe: '#22C55E', bg: '#DCFCE7', color: '#16A34A', label: 'Completada' };
  if (status === 'in_progress') return { stripe: '#4A6CF7', bg: '#E8EDFF', color: '#2D3FE0', label: 'En progreso' };
  return { stripe: '#F59E0B', bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' };
}

function firstRole(user) {
  if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
  return user?.role || user?.cargo || null;
}

function isTaskForCurrentUser(item, user) {
  if (!user) return false;
  const fullName = [user.name, user.lastname].filter(Boolean).join(' ').trim().toUpperCase();
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
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(parsed);
}

export default function TasksScreen() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing]     = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const router = useRouter();
  const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();
  const isConserje = firstRole(user) === 'conserje';

  useEffect(() => {
    if (!tasksLoaded) {
      refreshTasks().catch((err) =>
        Alert.alert('Error al cargar tareas', err?.message || 'No se pudieron cargar las tareas.')
      );
    }
  }, [tasksLoaded, refreshTasks]);

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
    catch (err) { Alert.alert('Error', err?.message || 'No se pudieron actualizar las tareas.'); }
    finally { setRefreshing(false); }
  };

  const screenTitle = isConserje ? 'Mis tareas' : 'Tareas asignadas';

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={visibleTasks}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={refreshScreen}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          {/* ── Hero ── */}
          <LinearGradient
            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>TRABAJO ASIGNADO</Text>
                <Text style={styles.heroTitle}>{screenTitle}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.heroBtn, searchOpen && styles.heroBtnActive]}
                  onPress={() => { setSearchOpen((v) => !v); if (searchOpen) setSearch(''); }}
                >
                  <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeNum}>{visibleTasks.length}</Text>
                  <Text style={styles.heroBadgeLabel}>tareas</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ── Buscador (visible solo al pulsar la lupa) ── */}
          {searchOpen && (
            <View style={styles.searchWrap}>
              <CustomSearchBar
                onChangeText={setSearch}
                value={search}
                placeholder="Buscar por tarea, ubicación o prioridad"
                autoFocus
              />
            </View>
          )}

          {/* ── Filtros ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => {
              const active = statusFilter === f.key;
              return active ? (
                <TouchableOpacity key={f.key} activeOpacity={0.85} style={{ borderRadius: 999, overflow: 'hidden' }}
                  onPress={() => setStatusFilter(f.key)}>
                  <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.filterChipActive}
                  >
                    <Text style={styles.filterChipTextActive}>{f.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={f.key} activeOpacity={0.85}
                  style={styles.filterChip}
                  onPress={() => setStatusFilter(f.key)}>
                  <Text style={styles.filterChipText}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Encabezado lista ── */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Bandeja de tareas</Text>
            <View style={styles.listCountPill}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={13} color="#4A6CF7" />
              <Text style={styles.listCountText}>{visibleTasks.length}</Text>
            </View>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const sc   = getStatusConfig(item.status);
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'task' } })}
          >
            <View style={[styles.cardIconBox, { backgroundColor: sc.bg }]}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={sc.color} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardTime}>{formatTaskDate(item)}</Text>
              </View>
              {item.location && (
                <Text style={styles.cardLocationText} numberOfLines={1}>{item.location}</Text>
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
        <View style={styles.emptyCard}>
          <LinearGradient
            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.emptyIconBox}
          >
            <View style={styles.emptyIconDeco} />
            <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Sin tareas asignadas</Text>
          <Text style={styles.emptyBody}>
            Cuando un supervisor te asigne una tarea, aparecerá aquí.
          </Text>
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
    paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroDeco1: {
    position: 'absolute', top: -50, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -20, left: -30,
    width: 120, height: 120, borderRadius: 60,
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
  heroBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  heroBadgeNum: {
    color: '#ffffff', fontSize: 22, fontWeight: '800',
  },
  heroBadgeLabel: {
    color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600',
  },

  // Search
  searchWrap: { paddingHorizontal: 20, paddingTop: 20 },

  // Filtros
  filterRow: {
    paddingHorizontal: 20, paddingVertical: 16, gap: 8,
  },
  filterChipActive: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999,
  },
  filterChipTextActive: {
    color: '#ffffff', fontSize: 13, fontWeight: '700',
  },
  filterChip: {
    borderRadius: 999, backgroundColor: '#ffffff',
    paddingHorizontal: 18, paddingVertical: 9,
    shadowColor: '#4A6CF7', shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  filterChipText: {
    color: '#8F95B2', fontSize: 13, fontWeight: '600',
  },

  // Encabezado lista
  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  listTitle: {
    color: '#1A1F36', fontSize: 17, fontWeight: '700',
  },
  listCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8EDFF', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  listCountText: {
    color: '#4A6CF7', fontSize: 13, fontWeight: '800',
  },

  // Card de tarea
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16,
    marginHorizontal: 20, marginBottom: 12,
    shadowColor: '#4A6CF7', shadowOpacity: 0.09,
    shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: {
    flex: 1, minWidth: 0, gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardTitle:  { flex: 1, color: '#1A1F36', fontSize: 14, fontWeight: '800' },
  cardTime:   { color: '#8F95B2', fontSize: 10, fontWeight: '500', marginLeft: 8, flexShrink: 0 },
  cardLocationText: {
    color: '#8F95B2', fontSize: 12, fontWeight: '500',
  },
  cardTags: {
    flexDirection: 'row', gap: 6, marginTop: 2,
  },
  cardTag: {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  cardTagText: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Empty state
  emptyCard: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#ffffff', borderRadius: 20,
    paddingVertical: 40, paddingHorizontal: 24,
    alignItems: 'center', gap: 12,
    shadowColor: '#4A6CF7', shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 4,
    shadowColor: '#2D3FE0', shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  emptyIconDeco: {
    position: 'absolute', top: -16, right: -16,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyTitle: {
    color: '#1A1F36', fontSize: 16, fontWeight: '800', textAlign: 'center',
  },
  emptyBody: {
    color: '#8F95B2', fontSize: 13, lineHeight: 19,
    textAlign: 'center', maxWidth: 240,
  },
});
