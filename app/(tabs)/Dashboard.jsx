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

function getStatusTone(status) {
    if (status === 'completed') {
        return { dot: styles.dotCompleted, badge: styles.badgeCompleted, badgeText: styles.badgeTextCompleted };
    }

    if (status === 'in_progress') {
        return { dot: styles.dotProgress, badge: styles.badgeProgress, badgeText: styles.badgeTextProgress };
    }

    return { dot: styles.dotPending, badge: styles.badgePending, badgeText: styles.badgeTextPending };
}

function hasScheduledDate(item) {
    return Boolean(item?.startAt || item?.dueDate);
}

function getTaskStart(item) {
    const raw = item?.startAt || item?.dueDate || null;

    if (!raw) {
        return null;
    }

    const parsed = new Date(raw);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    if (!item?.startAt && item?.dueDate) {
        parsed.setHours(6, 0, 0, 0);
    }

    return parsed;
}

function getTodayReference() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function isSameDay(left, right) {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function formatAgendaDate(date) {
    return new Intl.DateTimeFormat('es-EC', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatAgendaDay(date) {
    return new Intl.DateTimeFormat('es-EC', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(date);
}

function formatTaskDate(item) {
    const start = getTaskStart(item);

    if (!start) {
        return 'Sin fecha programada';
    }

    return formatAgendaDate(start);
}

export default function Dashboard() {
    const router = useRouter();
    const { user, stats, incidents, incidentsLoaded, refreshIncidents, tasks, tasksLoaded, refreshTasks } = useAppContext();

    useEffect(() => {
        if (!tasksLoaded) {
            console.log('Dashboard API base URL:', API_BASE_URL);
            refreshTasks().catch((error) => {
                console.error('Error al cargar dashboard:', error);
                Alert.alert(
                    'Error al cargar Dashboard',
                    error?.message || 'No se pudieron cargar las tareas.'
                );
            });
        }

        if (!incidentsLoaded) {
            refreshIncidents().catch((error) => {
                console.error('Error al cargar incidencias del dashboard:', error);
            });
        }
    }, [incidentsLoaded, refreshIncidents, tasksLoaded, refreshTasks]);

    const userName = user?.name || 'Usuario';
    const todayReference = useMemo(() => getTodayReference(), []);
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    const scheduledItems = useMemo(() => {
        return tasks
            .filter((item) => hasScheduledDate(item))
            .sort((a, b) => {
                const left = getTaskStart(a)?.getTime() ?? 0;
                const right = getTaskStart(b)?.getTime() ?? 0;
                return left - right;
            });
    }, [tasks]);

    const todayAgenda = useMemo(() => {
        return scheduledItems.filter((item) => {
            const start = getTaskStart(item);
            return start ? isSameDay(start, todayReference) : false;
        });
    }, [scheduledItems, todayReference]);

    const nextScheduledItem = useMemo(() => {
        const now = new Date();

        return scheduledItems.find((item) => {
            const start = getTaskStart(item);
            return start && start.getTime() >= now.getTime();
        }) || null;
    }, [scheduledItems]);

    const recentPendingItems = useMemo(() => {
        return [...incidents]
            .filter((item) => item.status === 'pending' || item.status === 'in_progress')
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 4);
    }, [incidents]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen options={{
                title: 'Panel de Control',
                headerLargeTitle: true,
                headerStyle: { backgroundColor: '#f3f6f4' },
            }} />

            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.eyebrow}>Resumen operativo</Text>
                    <Text style={styles.title}>Hola, {userName}</Text>
                    <Text style={styles.subtitle}>
                        Revisa la bandeja general y la agenda programada sin repetir vistas ni accesos redundantes.
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
                    <View style={styles.heroCopy}>
                        <Text style={styles.heroLabel}>Agenda de hoy</Text>
                        <Text style={styles.heroValue}>{todayAgenda.length}</Text>
                        <Text style={styles.heroHelper}>
                            {todayAgenda.length === 1 ? 'tarea programada hoy' : 'tareas programadas hoy'}
                        </Text>
                    </View>

                    <View style={styles.heroProgressPill}>
                        <Text style={styles.heroProgressValue}>{completionRate}%</Text>
                        <Text style={styles.heroProgressLabel}>completado</Text>
                    </View>
                </View>

                <View style={styles.heroHighlight}>
                    <Text style={styles.heroHighlightLabel}>Próxima tarea</Text>
                    <Text style={styles.heroHighlightTitle}>
                        {nextScheduledItem?.title || 'No hay tareas próximas'}
                    </Text>
                    <Text style={styles.heroHighlightMeta}>
                        {nextScheduledItem ? formatTaskDate(nextScheduledItem) : 'Cuando existan tareas con fecha aparecerán aquí.'}
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.metricCardNeutral]}>
                    <Text style={styles.metricLabel}>Bandeja total</Text>
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
                <Text style={styles.sectionTitle}>Agenda de hoy</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/Calendar')}>
                    <Text style={styles.sectionLink}>Abrir agenda</Text>
                </TouchableOpacity>
            </View>

            {todayAgenda.length > 0 ? (
                todayAgenda.slice(0, 3).map((item) => {
                    const tone = getStatusTone(item.status);

                    return (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={styles.activityCard}
                            onPress={() => router.push({
                                pathname: '/IncidentDetail',
                                params: { id: String(item.id), type: 'task' },
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
                                <Text style={styles.activityMeta}>{formatTaskDate(item)}</Text>
                                <Text style={styles.activityMeta}>{item.location || 'Sin ubicación'}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin tareas para hoy</Text>
                    <Text style={styles.emptyText}>
                        La agenda mostrará aquí las tareas programadas para el día actual.
                    </Text>
                </View>
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próxima tarea programada</Text>
            </View>

            {nextScheduledItem ? (
                <TouchableOpacity
                    style={styles.focusCard}
                    onPress={() => router.push({
                        pathname: '/IncidentDetail',
                        params: { id: String(nextScheduledItem.id), type: 'task' },
                    })}
                >
                    <View style={styles.focusCardHeader}>
                        <Text style={styles.focusTitle}>{nextScheduledItem.title}</Text>
                        <View style={styles.priorityPill}>
                            <Text style={styles.priorityPillText}>{nextScheduledItem.priority || 'Media'}</Text>
                        </View>
                    </View>
                    <Text style={styles.focusMeta}>{formatAgendaDay(getTaskStart(nextScheduledItem))}</Text>
                    <Text style={styles.focusDescription} numberOfLines={2}>
                        {nextScheduledItem.description || 'Sin descripción adicional.'}
                    </Text>
                    <View style={styles.focusFooter}>
                        <Text style={styles.focusFooterText}>Responsable: {nextScheduledItem.assignedCleanerName || 'Sin asignar'}</Text>
                        <Text style={styles.focusFooterLink}>Abrir detalle</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin próxima tarea</Text>
                    <Text style={styles.emptyText}>
                        Todavía no hay elementos programados a futuro en la agenda.
                    </Text>
                </View>
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pendientes recientes</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/Incidents')}>
                    <Text style={styles.sectionLink}>Abrir incidencias</Text>
                </TouchableOpacity>
            </View>

            {recentPendingItems.length > 0 ? (
                recentPendingItems.map((item) => {
                    const tone = getStatusTone(item.status);

                    return (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={styles.activityCard}
                            onPress={() => router.push({
                                pathname: '/IncidentDetail',
                                params: { id: String(item.id), type: 'incident' },
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
                                <Text style={styles.activityMeta}>{item.location || 'Sin ubicación'}</Text>
                                <Text style={styles.activityMeta}>Responsable: {item.assignedCleanerName || 'Sin asignar'}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin pendientes recientes</Text>
                    <Text style={styles.emptyText}>
                        Cuando existan incidencias activas aparecerán aquí para seguimiento rápido.
                    </Text>
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
        gap: 14,
        marginBottom: 18,
    },
    heroCopy: {
        flex: 1,
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
    heroHighlight: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 16,
    },
    heroHighlightLabel: {
        color: '#9fd0c2',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    heroHighlightTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    heroHighlightMeta: {
        color: '#d7ebe5',
        fontSize: 13,
        lineHeight: 18,
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
        marginBottom: 10,
        textTransform: 'capitalize',
    },
    focusDescription: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 14,
    },
    focusFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#eef3f0',
    },
    focusFooterText: {
        color: '#64746f',
        fontSize: 13,
        flex: 1,
        marginRight: 10,
    },
    focusFooterLink: {
        color: '#10342d',
        fontSize: 13,
        fontWeight: '800',
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
        marginTop: 8,
        marginRight: 12,
    },
    activityBody: {
        flex: 1,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 6,
    },
    activityTitle: {
        flex: 1,
        color: '#16211e',
        fontSize: 16,
        fontWeight: '800',
    },
    activityMeta: {
        color: '#64746f',
        fontSize: 13,
        lineHeight: 19,
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
    dotPending: {
        backgroundColor: '#c48a21',
    },
    dotProgress: {
        backgroundColor: '#1676a1',
    },
    dotCompleted: {
        backgroundColor: '#1f9b66',
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
