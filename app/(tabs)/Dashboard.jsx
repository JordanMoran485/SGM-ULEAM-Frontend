import React, { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useAppContext } from '../../src/context/AppContext';
import { API_BASE_URL } from '../../src/services/api';

function getInitials(name) {
    if (!name) {
        return 'U';
    }

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function getPriorityWeight(priority) {
    if (priority === 'Alta') {
        return 3;
    }

    if (priority === 'Media') {
        return 2;
    }

    return 1;
}

function getStatusTone(status) {
    if (status === 'completed') {
        return { dot: styles.dotCompleted, badge: styles.badgeCompleted, badgeText: styles.badgeTextCompleted };
    }

    if (status === 'in_progress') {
        return { dot: styles.dotProgress, badge: styles.badgeProgress, badgeText: styles.badgeTextProgress };
    }

    return { dot: styles.dotPending, badge: styles.badgePending, badgeText: styles.badgeTextPending };
}

function groupByLocation(items) {
    const grouped = items.reduce((accumulator, item) => {
        const location = item.location || 'Sin ubicación';
        accumulator[location] = (accumulator[location] || 0) + 1;
        return accumulator;
    }, {});

    return Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
}

export default function Dashboard() {
    const router = useRouter();
    const { user, stats, incidents, incidentsLoaded, refreshIncidents } = useAppContext();

    useEffect(() => {
        if (!incidentsLoaded) {
            console.log('Dashboard API base URL:', API_BASE_URL);
            refreshIncidents().catch((error) => {
                console.error('Error al cargar dashboard:', error);
                Alert.alert(
                    'Error al cargar Dashboard',
                    error?.message || 'No se pudieron cargar las incidencias.'
                );
            });
        }
    }, [incidentsLoaded, refreshIncidents]);

    const userName = user?.name || 'Usuario';

    const urgentItem = useMemo(() => {
        return [...incidents]
            .filter((item) => item.status !== 'completed')
            .sort((a, b) => {
                const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);

                if (priorityDiff !== 0) {
                    return priorityDiff;
                }

                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            })[0] || null;
    }, [incidents]);

    const recentItems = incidents.slice(0, 5);
    const hotspotLocations = groupByLocation(incidents);
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen options={{
                title: 'Panel de Control',
                headerLargeTitle: true,
                headerStyle: { backgroundColor: '#f3f6f4' }
            }} />

            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.eyebrow}>Resumen operativo</Text>
                    <Text style={styles.title}>Hola, {userName}</Text>
                    <Text style={styles.subtitle}>
                        Prioriza tareas, revisa la carga activa y detecta rápido las zonas con más incidencias.
                    </Text>
                </View>

                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                </View>
            </View>

            <LinearGradient
                colors={['#0f2f29', '#1a4b41']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.heroTopRow}>
                    <View>
                        <Text style={styles.heroLabel}>Carga en curso</Text>
                        <Text style={styles.heroValue}>{stats.inProgress}</Text>
                        <Text style={styles.heroHelper}>
                            {stats.pending} pendientes y {stats.completed} completadas
                        </Text>
                    </View>

                    <View style={styles.heroProgressPill}>
                        <Text style={styles.heroProgressValue}>{completionRate}%</Text>
                        <Text style={styles.heroProgressLabel}>resuelto</Text>
                    </View>
                </View>

                <View style={styles.heroBottomRow}>
                    <TouchableOpacity
                        style={styles.heroActionPrimary}
                        onPress={() => router.push('/(tabs)/Incidents')}
                    >
                        <Text style={styles.heroActionPrimaryText}>Ver tareas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.heroActionSecondary}
                        onPress={() => router.push('/(tabs)/Profile')}
                    >
                        <Text style={styles.heroActionSecondaryText}>Mi perfil</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.metricCardNeutral]}>
                    <Text style={styles.metricLabel}>Total</Text>
                    <Text style={styles.metricValue}>{stats.total}</Text>
                </View>
                <View style={[styles.metricCard, styles.metricCardWarning]}>
                    <Text style={styles.metricLabel}>Pendientes</Text>
                    <Text style={styles.metricValue}>{stats.pending}</Text>
                </View>
                <View style={[styles.metricCard, styles.metricCardCool]}>
                    <Text style={styles.metricLabel}>En progreso</Text>
                    <Text style={styles.metricValue}>{stats.inProgress}</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Prioridad del día</Text>
            </View>

            {urgentItem ? (
                <TouchableOpacity
                    style={styles.focusCard}
                    onPress={() => router.push({
                        pathname: '/IncidentDetail',
                        params: { id: String(urgentItem.id) }
                    })}
                >
                    <View style={styles.focusCardHeader}>
                        <Text style={styles.focusTitle}>{urgentItem.title}</Text>
                        <View style={styles.priorityPill}>
                            <Text style={styles.priorityPillText}>{urgentItem.priority || 'Media'}</Text>
                        </View>
                    </View>
                    <Text style={styles.focusMeta}>{urgentItem.location}</Text>
                    <Text style={styles.focusDescription} numberOfLines={2}>
                        {urgentItem.description || 'Sin descripción adicional.'}
                    </Text>
                    <View style={styles.focusFooter}>
                        <Text style={styles.focusFooterText}>Responsable: {urgentItem.assignedCleanerName}</Text>
                        <Text style={styles.focusFooterLink}>Abrir detalle</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No hay tareas activas</Text>
                    <Text style={styles.emptyText}>Cuando existan pendientes aparecerán aquí como prioridad principal.</Text>
                </View>
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Zonas con mayor carga</Text>
            </View>

            <View style={styles.hotspotCard}>
                {hotspotLocations.length > 0 ? (
                    hotspotLocations.map(([location, count], index) => (
                        <View key={`${location}-${index}`} style={styles.hotspotRow}>
                            <View style={styles.hotspotRank}>
                                <Text style={styles.hotspotRankText}>{index + 1}</Text>
                            </View>
                            <View style={styles.hotspotContent}>
                                <Text style={styles.hotspotLocation}>{location}</Text>
                                <Text style={styles.hotspotCount}>{count} reportes asociados</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Aún no hay suficiente actividad para identificar zonas críticas.</Text>
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/Incidents')}>
                    <Text style={styles.sectionLink}>Ver todo</Text>
                </TouchableOpacity>
            </View>

            {recentItems.length > 0 ? (
                recentItems.map((item) => {
                    const tone = getStatusTone(item.status);

                    return (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={styles.activityCard}
                            onPress={() => router.push({
                                pathname: '/IncidentDetail',
                                params: { id: String(item.id) }
                            })}
                        >
                            <View style={[styles.activityDot, tone.dot]} />
                            <View style={styles.activityBody}>
                                <View style={styles.activityHeader}>
                                    <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                                    <View style={[styles.statusBadge, tone.badge]}>
                                        <Text style={[styles.statusBadgeText, tone.badgeText]}>{item.statusLabel}</Text>
                                    </View>
                                </View>
                                <Text style={styles.activityMeta}>{item.location}</Text>
                                <Text style={styles.activityMeta}>Responsable: {item.assignedCleanerName}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin actividad reciente</Text>
                    <Text style={styles.emptyText}>Las tareas o incidencias más nuevas aparecerán en esta sección.</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f6f4',
    },
    content: {
        padding: 20,
        paddingBottom: 38,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerText: {
        flex: 1,
        paddingRight: 16,
    },
    eyebrow: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        color: '#16211e',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#64746f',
        fontSize: 15,
        lineHeight: 22,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#dbe5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#17342d',
        fontSize: 16,
        fontWeight: '800',
    },
    heroCard: {
        borderRadius: 30,
        padding: 22,
        marginBottom: 18,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    heroLabel: {
        color: '#9fd0c2',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    heroValue: {
        color: '#ffffff',
        fontSize: 52,
        fontWeight: '800',
        lineHeight: 56,
    },
    heroHelper: {
        color: '#d7ebe5',
        fontSize: 14,
        marginTop: 4,
    },
    heroProgressPill: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    heroProgressValue: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
    },
    heroProgressLabel: {
        color: '#c3ddd6',
        fontSize: 12,
        marginTop: 2,
    },
    heroBottomRow: {
        flexDirection: 'row',
        gap: 10,
    },
    heroActionPrimary: {
        flex: 1,
        backgroundColor: '#f3f6f4',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },
    heroActionPrimaryText: {
        color: '#10342d',
        fontSize: 14,
        fontWeight: '800',
    },
    heroActionSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },
    heroActionSecondaryText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        borderRadius: 22,
        padding: 16,
    },
    metricCardNeutral: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    metricCardWarning: {
        backgroundColor: '#f7efe3',
        borderWidth: 1,
        borderColor: '#ebdec5',
    },
    metricCardCool: {
        backgroundColor: '#eaf3f8',
        borderWidth: 1,
        borderColor: '#d3e4ef',
    },
    metricLabel: {
        color: '#687974',
        fontSize: 12,
        marginBottom: 8,
    },
    metricValue: {
        color: '#16211e',
        fontSize: 30,
        fontWeight: '800',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#16211e',
        fontSize: 19,
        fontWeight: '800',
    },
    sectionLink: {
        color: '#0f2f29',
        fontSize: 14,
        fontWeight: '800',
    },
    focusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 24,
    },
    focusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8,
    },
    focusTitle: {
        flex: 1,
        color: '#16211e',
        fontSize: 19,
        fontWeight: '800',
    },
    priorityPill: {
        backgroundColor: '#f3eee2',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    priorityPillText: {
        color: '#906c28',
        fontSize: 12,
        fontWeight: '800',
    },
    focusMeta: {
        color: '#0f2f29',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    focusDescription: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 20,
    },
    focusFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#edf2ef',
    },
    focusFooterText: {
        color: '#64746f',
        fontSize: 13,
    },
    focusFooterLink: {
        color: '#0f2f29',
        fontSize: 13,
        fontWeight: '800',
    },
    hotspotCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 24,
    },
    hotspotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    hotspotRank: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#edf4f1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    hotspotRankText: {
        color: '#17342d',
        fontWeight: '800',
    },
    hotspotContent: {
        flex: 1,
    },
    hotspotLocation: {
        color: '#16211e',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    hotspotCount: {
        color: '#687974',
        fontSize: 13,
    },
    activityCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 12,
    },
    activityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 7,
        marginRight: 12,
    },
    dotPending: {
        backgroundColor: '#c48a21',
    },
    dotProgress: {
        backgroundColor: '#1676a1',
    },
    dotCompleted: {
        backgroundColor: '#1f9b66',
    },
    activityBody: {
        flex: 1,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    activityTitle: {
        flex: 1,
        color: '#16211e',
        fontSize: 16,
        fontWeight: '800',
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    badgePending: {
        backgroundColor: '#f5ebd8',
    },
    badgeTextPending: {
        color: '#936b20',
    },
    badgeProgress: {
        backgroundColor: '#e3eff6',
    },
    badgeTextProgress: {
        color: '#14688f',
    },
    badgeCompleted: {
        backgroundColor: '#e5f4ec',
    },
    badgeTextCompleted: {
        color: '#1b8659',
    },
    activityMeta: {
        color: '#687974',
        fontSize: 13,
        lineHeight: 19,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 24,
    },
    emptyTitle: {
        color: '#16211e',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    emptyText: {
        color: '#687974',
        fontSize: 14,
        lineHeight: 21,
    },
});
