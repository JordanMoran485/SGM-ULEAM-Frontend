import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { API_BASE_URL } from '../../src/services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

function formatRelative(value) {
    if (!value) return '';
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function getStatusConfig(status) {
    if (status === 'completed') return { stripe: '#22C55E' };
    if (status === 'in_progress') return { stripe: '#4A6CF7' };
    return { stripe: '#F59E0B' };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SegmentedBar({ pending, inProgress, completed }) {
    const total = (pending + inProgress + completed) || 1;
    return (
        <View style={bar.wrapper}>
            {pending > 0 && (
                <View style={[bar.segment, { flex: pending / total, backgroundColor: '#F59E0B' }]} />
            )}
            {inProgress > 0 && (
                <View style={[bar.segment, { flex: inProgress / total, backgroundColor: '#4A6CF7' }]} />
            )}
            {completed > 0 && (
                <View style={[bar.segment, { flex: completed / total, backgroundColor: '#22C55E' }]} />
            )}
        </View>
    );
}

const bar = StyleSheet.create({
    wrapper: { flexDirection: 'row', height: 7, borderRadius: 4, overflow: 'hidden', gap: 2, marginTop: 14 },
    segment: { borderRadius: 4 },
});

// ─── skeletons ──────────────────────────────────────────────────────────────

function SkeletonChartCard({ shimmer }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    const heights = [50, 30, 70, 20, 60, 40, 35];
    return (
        <View style={skStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
                {heights.map((h, i) => (
                    <Animated.View key={i} style={{ width: 28, height: h, borderRadius: 6, backgroundColor: '#E8EDFF', opacity }} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                {['L','M','X','J','V','S','D'].map((d) => (
                    <Animated.View key={d} style={{ width: 20, height: 10, borderRadius: 4, backgroundColor: '#E8EDFF', opacity }} />
                ))}
            </View>
        </View>
    );
}


function SkeletonTimelineRow({ shimmer, isLast }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    return (
        <View style={{ flexDirection: 'row', minHeight: 56 }}>
            <View style={{ width: 24, alignItems: 'center', paddingTop: 16 }}>
                <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8EDFF', opacity }} />
                {!isLast && <View style={{ position: 'absolute', top: 26, bottom: 0, width: 1.5, backgroundColor: '#F1F3FF' }} />}
            </View>
            <View style={[{ flex: 1, paddingVertical: 14, paddingLeft: 12, gap: 6 }, !isLast && { borderBottomWidth: 1, borderBottomColor: '#F1F3FF' }]}>
                <Animated.View style={[skStyles.line, { width: '70%', height: 13, opacity }]} />
                <Animated.View style={[skStyles.line, { width: '40%', height: 11, opacity }]} />
            </View>
        </View>
    );
}

const skStyles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff', borderRadius: 20, padding: 18, gap: 12,
        shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 14,
        shadowOffset: { width: 0, height: 3 }, elevation: 3,
    },
    line: { borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.45)' },
    pill: { height: 24, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)' },
});

// ─── screen ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const router = useRouter();
    const {
        user, stats, incidents, incidentsLoaded, refreshIncidents,
        tasks, tasksLoaded, refreshTasks, notifications,
    } = useAppContext();

    useEffect(() => {
        if (!tasksLoaded) {
            console.log('Dashboard API base URL:', API_BASE_URL);
            refreshTasks().catch((err) => {
                Alert.alert('Error al cargar Dashboard', err?.message || 'No se pudieron cargar las tareas.');
            });
        }
        if (!incidentsLoaded) {
            refreshIncidents().catch((err) => console.error('Error incidencias:', err));
        }
    }, [incidentsLoaded, refreshIncidents, tasksLoaded, refreshTasks]);

    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 750, useNativeDriver: true }),
            ])
        ).start();
    }, [shimmer]);

    const userName    = user?.name || 'Usuario';
    const unreadCount    = (notifications || []).filter((n) => !n.isRead).length;

    const recentActivity = useMemo(() =>
        [...incidents]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 4),
        [incidents]
    );

    // Convierte a fecha Ecuador (UTC-5) sin depender del timezone del dispositivo
    const toEcuadorStr = (d) => {
        const ec = new Date(d.getTime() - 5 * 60 * 60 * 1000);
        return `${ec.getUTCFullYear()}-${String(ec.getUTCMonth() + 1).padStart(2, '0')}-${String(ec.getUTCDate()).padStart(2, '0')}`;
    };

    const ecuadorToday = toEcuadorStr(new Date());
    const [ey, em, ed] = ecuadorToday.split('-').map(Number);
    const ecuadorDow   = new Date(Date.UTC(ey, em - 1, ed, 12)).getUTCDay();
    const todayIndex   = (ecuadorDow + 6) % 7; // 0=Lun … 6=Dom

    const { weeklyData, weekTotal, prevWeekTotal } = useMemo(() => {
        const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        const counts     = [0, 0, 0, 0, 0, 0, 0];
        const prevCounts = [0, 0, 0, 0, 0, 0, 0];

        const makeDays = (offset) => Array.from({ length: 7 }, (_, i) => {
            const d = new Date(Date.UTC(ey, em - 1, ed + i - todayIndex + offset, 12));
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        });

        const weekDays     = makeDays(0);
        const prevWeekDays = makeDays(-7);

        tasks.forEach((t) => {
            if (t.status !== 'completed') return;
            const raw = String(t.updatedAt || t.createdAt || '');
            if (!raw) return;
            const s = /Z|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z';
            const d = new Date(s);
            if (isNaN(d)) return;
            const ds = toEcuadorStr(d);
            const idx = weekDays.indexOf(ds);
            if (idx !== -1) { counts[idx]++; return; }
            const pidx = prevWeekDays.indexOf(ds);
            if (pidx !== -1) prevCounts[pidx]++;
        });

        return {
            weeklyData:    labels.map((label, i) => ({ label, count: counts[i] })),
            weekTotal:     counts.reduce((a, b) => a + b, 0),
            prevWeekTotal: prevCounts.reduce((a, b) => a + b, 0),
        };
    }, [tasks, todayIndex, ey, em, ed]);

    const chartMax = Math.max(...weeklyData.map((d) => d.count), 1);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ title: '', headerTransparent: true, headerShadowVisible: false }} />

            {/* ── Hero header ── */}
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                {/* Círculos en su propio clip para no bloquear el overflow de las cards */}
                <View style={styles.heroDecoClip} pointerEvents="none">
                    <View style={styles.heroDeco1} />
                    <View style={styles.heroDeco2} />
                </View>

                <View style={styles.heroTopRow}>
                    <View style={styles.heroAvatar}>
                        {user?.profile_photo_url ? (
                            <Image source={{ uri: user.profile_photo_url }} style={styles.heroAvatarImage} />
                        ) : (
                            <Text style={styles.heroAvatarInitials}>{getInitials(userName)}</Text>
                        )}
                    </View>
                    <View style={styles.heroNameCol}>
                        <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                        <Text style={styles.heroName} numberOfLines={1}>{userName}</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.heroBtn}
                        onPress={() => router.push('/(tabs)/Calendar')}
                    >
                        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.heroBtn}
                        onPress={() => router.push('/(tabs)/Notifications')}
                    >
                        <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── 3 stat cards al filo del bottom del hero ── */}
                <View style={styles.statRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={17} color="#F59E0B" />
                        </View>
                        <Text style={styles.statNum}>{incidentsLoaded ? (stats.pending ?? 0) : '–'}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>Pendientes</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8F8FB' }]}>
                            <MaterialCommunityIcons name="progress-clock" size={17} color="#06B6D4" />
                        </View>
                        <Text style={styles.statNum}>{incidentsLoaded ? (stats.inProgress ?? 0) : '–'}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>En curso</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                            <MaterialCommunityIcons name="check-circle-outline" size={17} color="#22C55E" />
                        </View>
                        <Text style={styles.statNum}>{incidentsLoaded ? (stats.completed ?? 0) : '–'}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>Completadas</Text>
                    </View>
                </View>

            </LinearGradient>

            {/* ── Gráfica semanal ── */}
            <View style={styles.section}>
                {!tasksLoaded ? (
                    <SkeletonChartCard shimmer={shimmer} />
                ) : (
                    <View style={styles.chartCard}>
                        {/* Header */}
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartEyebrow}>Reportes Solucionados</Text>
                                <View style={styles.chartNumRow}>
                                    <Text style={styles.chartBigNum}>{weekTotal}</Text>
                                    <Text style={styles.chartWeekLabel}>esta semana</Text>
                                </View>
                            </View>
                            <View style={styles.chartIconBox}>
                                <MaterialCommunityIcons name="chart-bar" size={24} color="#2D3FE0" />
                            </View>
                        </View>

                        {/* Barras */}
                        <View style={styles.chartBars}>
                            {weeklyData.map((day, index) => {
                                const isToday = index === todayIndex;
                                const barH = day.count > 0
                                    ? Math.max((day.count / chartMax) * 108, 8)
                                    : 4;
                                const dayFull = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][index];
                                return (
                                    <View key={day.label} style={styles.chartBarCol}>
                                        <View style={styles.chartTodayLabelBox}>
                                            {isToday && (
                                                <Text style={styles.chartTodayLabel}>{dayFull}</Text>
                                            )}
                                        </View>
                                        <View style={styles.chartTrack}>
                                            <View style={[
                                                styles.chartBar,
                                                { height: barH },
                                                isToday ? styles.chartBarToday : styles.chartBarIdle,
                                            ]} />
                                        </View>
                                        <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                                            {day.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </View>

            {/* ── Actividad reciente ── */}
            <View style={styles.section}>
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Actividad reciente</Text>
                    {incidentsLoaded && recentActivity.length > 0 && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.sectionLink}
                            onPress={() => router.push('/(tabs)/Incidents')}
                        >
                            <Text style={styles.sectionLinkText}>Ver todas</Text>
                            <MaterialCommunityIcons name="arrow-right" size={13} color="#4A6CF7" />
                        </TouchableOpacity>
                    )}
                </View>

                {!incidentsLoaded ? (
                    <View style={styles.timelineCard}>
                        {[0, 1, 2, 3].map((i) => (
                            <SkeletonTimelineRow key={i} shimmer={shimmer} isLast={i === 3} />
                        ))}
                    </View>
                ) : recentActivity.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <LinearGradient
                            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.emptyIconBox}
                        >
                            <View style={styles.emptyIconDeco} />
                            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={30} color="rgba(255,255,255,0.9)" />
                        </LinearGradient>
                        <Text style={styles.emptyTitle}>Sin actividad reciente</Text>
                        <Text style={styles.emptyBody}>Las incidencias que registres aparecerán aquí.</Text>
                    </View>
                ) : (
                    <View style={styles.timelineCard}>
                        {recentActivity.map((item, index) => {
                            const sc = getStatusConfig(item.status);
                            const isLast = index === recentActivity.length - 1;
                            return (
                                <TouchableOpacity
                                    key={String(item.id)}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'incident' } })}
                                >
                                    <View style={styles.timelineRow}>
                                        <View style={styles.timelineLeft}>
                                            <View style={[styles.timelineDot, { backgroundColor: sc.stripe }]} />
                                            {!isLast && <View style={styles.timelineLine} />}
                                        </View>
                                        <View style={[styles.timelineBody, !isLast && styles.timelineBodyBorder]}>
                                            <View style={styles.timelineTopRow}>
                                                <Text style={styles.timelineTitle} numberOfLines={1}>{item.title}</Text>
                                                <Text style={styles.timelineTime}>{formatRelative(item.createdAt)}</Text>
                                            </View>
                                            {item.location && (
                                                <Text style={styles.timelineMeta} numberOfLines={1}>{item.location}</Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2FF' },
    content:   { paddingBottom: 48 },

    // Hero header
    hero: {
        paddingTop: 56, paddingBottom: 0, paddingHorizontal: 24,
    },
    heroDecoClip: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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
    heroTopRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    },
    heroAvatar: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.20)',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    heroAvatarImage: { width: 64, height: 64, borderRadius: 32 },
    heroAvatarInitials: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
    heroNameCol: { flex: 1, gap: 4 },
    heroGreeting: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
    heroName: { color: '#ffffff', fontSize: 26, fontWeight: '800' },
    heroBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    heroBadge: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: '#F43F5E', borderRadius: 999,
        minWidth: 14, height: 14, paddingHorizontal: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    heroBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },

    // Stat cards (al filo del bottom del hero)
    statRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        height: 104,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#2D3FE0',
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    statIcon: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    statNum: {
        color: '#1A1F36', fontSize: 22, fontWeight: '800',
    },
    statLabel: {
        color: '#8F95B2', fontSize: 10, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.5,
        textAlign: 'center',
    },

    // Section
    section:    { paddingHorizontal: 20, paddingTop: 24 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: '#1A1F36', fontSize: 17, fontWeight: '700', marginBottom: 14 },
    sectionLink: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#E8EDFF', borderRadius: 999,
        paddingHorizontal: 12, paddingVertical: 6,
        marginBottom: 14,
    },
    sectionLinkText: { color: '#4A6CF7', fontSize: 12, fontWeight: '700' },

    // Chart
    chartCard: {
        backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#4A6CF7', shadowOpacity: 0.08,
        shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    chartHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
    },
    chartEyebrow: {
        color: '#8F95B2', fontSize: 10, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
    },
    chartNumRow: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    },
    chartBigNum: {
        color: '#2D3FE0', fontSize: 36, fontWeight: '800',
    },
    chartWeekLabel: {
        color: '#8F95B2', fontSize: 12, fontWeight: '500', paddingBottom: 6,
    },
    chartIconBox: {
        backgroundColor: '#E8EDFF', borderRadius: 12, padding: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    chartBars: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: 16, paddingBottom: 20,
    },
    chartBarCol: {
        flex: 1, alignItems: 'center', gap: 4,
    },
    chartTodayLabelBox: {
        height: 18, justifyContent: 'center', alignItems: 'center',
    },
    chartTodayLabel: {
        color: '#2D3FE0', fontSize: 10, fontWeight: '700',
    },
    chartTrack: {
        height: 108, width: '100%', justifyContent: 'flex-end',
    },
    chartBar: {
        width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6,
    },
    chartBarIdle: {
        backgroundColor: '#DBEAFE',
    },
    chartBarToday: {
        backgroundColor: '#2D3FE0',
        shadowColor: '#2D3FE0', shadowOpacity: 0.30, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    chartLabel: {
        color: '#8F95B2', fontSize: 10, fontWeight: '700',
    },
    chartLabelToday: {
        color: '#2D3FE0', fontWeight: '800',
    },

    // Empty state actividad
    emptyCard: {
        backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 36,
        paddingHorizontal: 24, alignItems: 'center', gap: 12,
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

    // Timeline
    timelineCard: {
        backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 8,
        paddingLeft: 16, paddingRight: 16,
        shadowColor: '#4A6CF7', shadowOpacity: 0.08,
        shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    timelineRow: { flexDirection: 'row', minHeight: 56 },
    timelineLeft: { width: 24, alignItems: 'center', paddingTop: 16 },
    timelineDot:  { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    timelineLine: {
        position: 'absolute', top: 26, bottom: 0,
        width: 1.5, backgroundColor: '#F1F3FF',
    },
    timelineBody: {
        flex: 1, paddingVertical: 14, paddingLeft: 12, gap: 3,
    },
    timelineBodyBorder: {
        borderBottomWidth: 1, borderBottomColor: '#F1F3FF',
    },
    timelineTopRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 8,
    },
    timelineTitle: { flex: 1, color: '#1A1F36', fontSize: 14, fontWeight: '700' },
    timelineTime:  { color: '#8F95B2', fontSize: 11, fontWeight: '500', flexShrink: 0 },
    timelineMeta:  { color: '#8F95B2', fontSize: 12, fontWeight: '500' },
});
