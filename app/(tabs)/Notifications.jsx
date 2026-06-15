import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, FlatList, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { useToast } from '../../src/components/Toast';

function formatRelativeDate(value) {
    if (!value) return 'Ahora';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    const diff = (Date.now() - parsed.getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(parsed);
}

function parseWeekLabel(weekLabel) {
    if (!weekLabel) return null;
    const part = String(weekLabel).split('–')[0].trim();
    const [d, m, y] = part.split('/');
    if (!d || !m || !y) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function getNotificationType(notification) {
    if (notification.notificationType === 'incident_rejected')
        return { label: 'Rechazada', bg: '#FFE4E8', text: '#F43F5E', stripe: '#F43F5E' };
    if (notification.notificationType === 'incident_accepted')
        return { label: 'Aprobada', bg: '#DCFCE7', text: '#22C55E', stripe: '#22C55E' };
    if (notification.notificationType === 'task_unlinked')
        return { label: 'Desvinculada', bg: '#FFE4E8', text: '#F43F5E', stripe: '#F43F5E' };
    if (notification.notificationType === 'week_summary')
        return { label: 'Semana', bg: '#E8EDFF', text: '#2D3FE0', stripe: '#4A6CF7' };
    if (notification.notificationType === 'task_assigned' || notification.taskId)
        return { label: 'Tarea', bg: '#E8EDFF', text: '#2D3FE0', stripe: '#4A6CF7' };
    if (notification.incidentId)
        return { label: 'Incidencia', bg: '#E8F8FB', text: '#06B6D4', stripe: '#4A6CF7' };
    return { label: 'Sistema', bg: '#F1F3FF', text: '#8F95B2', stripe: '#4A6CF7' };
}

function SkeletonCard({ shimmer }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    return (
        <View style={styles.card}>
            <View style={[styles.unreadStripe, { backgroundColor: '#E8EDFF' }]} />
            <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                    <Animated.View style={[styles.skeletonPill, { width: 72, opacity }]} />
                    <Animated.View style={[styles.skeletonLine, { width: 44, height: 12, opacity }]} />
                </View>
                <Animated.View style={[styles.skeletonLine, { width: '78%', height: 15, opacity }]} />
                <Animated.View style={[styles.skeletonLine, { width: '100%', height: 12, opacity }]} />
                <Animated.View style={[styles.skeletonLine, { width: '55%', height: 12, opacity }]} />
                <View style={[styles.cardBottomRow, { marginTop: 4 }]}>
                    <Animated.View style={[styles.skeletonPill, { width: 96, opacity }]} />
                    <Animated.View style={[styles.skeletonPill, { width: 58, opacity }]} />
                </View>
            </View>
        </View>
    );
}

function FilterTab({ label, active, onPress }) {
    if (active) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.filterTabWrapper}>
                <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterTabActive}
                >
                    <Text style={styles.filterTabActiveText}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.filterTabWrapper, styles.filterTabInactive]}>
            <Text style={styles.filterTabInactiveText}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function NotificationsScreen() {
    const router = useRouter();
    const toast = useToast();
    const {
        notifications,
        notificationsLoaded,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        isLoading,
    } = useAppContext();

    const [filter, setFilter]               = useState('all');
    const [visibleCount, setVisibleCount]   = useState(10);
    const [contentHeight, setContentHeight] = useState(1);
    const [listHeight, setListHeight]       = useState(1);
    const shimmer    = useRef(new Animated.Value(0)).current;
    const scrollAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 750, useNativeDriver: true }),
            ])
        ).start();
    }, [shimmer]);

    useEffect(() => {
        if (!notificationsLoaded) {
            refreshNotifications().catch((err) => {
                toast.error('Error', err?.message || 'No se pudieron cargar las notificaciones.');
            });
        }
    }, [notificationsLoaded, refreshNotifications]);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
        } catch (err) {
            toast.error('Error', err?.message || 'No se pudieron marcar las notificaciones.');
        }
    };

    const handleOpen = async (notification) => {
        try {
            if (!notification.isRead) await markNotificationRead(notification.id);

            if (notification.notificationType === 'week_summary') {
                const weekStart = parseWeekLabel(notification.weekLabel);
                router.push({
                    pathname: '/(tabs)/Calendar',
                    params: { weekMode: '1', ...(weekStart ? { weekStart } : {}) },
                });
                return;
            }

            const goToIncident = notification.notificationType === 'incident_accepted'
                || notification.notificationType === 'incident_rejected';

            if (notification.incidentId && (goToIncident || !notification.taskId)) {
                router.push({ pathname: '/IncidentDetail', params: { id: String(notification.incidentId), type: 'incident' } });
                return;
            }
            if (notification.taskId) {
                router.push({ pathname: '/IncidentDetail', params: { id: String(notification.taskId), type: 'task' } });
            }
        } catch (err) {
            console.error('Error al abrir notificación:', err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const visible = filter === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    useEffect(() => { setVisibleCount(10); }, [filter]);

    const displayedNotifications = visible.slice(0, visibleCount);
    const hasMore                = displayedNotifications.length < visible.length;

    const indicatorHeight = Math.max(28, (listHeight / Math.max(contentHeight, 1)) * listHeight);
    const safeMaxScroll   = Math.max(1, contentHeight - listHeight);
    const safeMaxY        = Math.max(0, listHeight - indicatorHeight - 16);
    const indicatorTop    = scrollAnim.interpolate({
        inputRange:  [0, safeMaxScroll],
        outputRange: [8, 8 + safeMaxY],
        extrapolate: 'clamp',
    });
    const showMinimap = contentHeight > listHeight + 60;

    const ListHeader = (
        <>
            <Stack.Screen options={{ title: '', headerTransparent: true, headerShadowVisible: false }} />
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.decCircle1} />
                <View style={styles.decCircle2} />
                <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.heroContent}>
                    <View>
                        <Text style={styles.heroEyebrow}>Bandeja operativa</Text>
                        <Text style={styles.heroTitle}>Notificaciones</Text>
                    </View>
                    {unreadCount > 0 && (
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeNumber}>{unreadCount}</Text>
                            <Text style={styles.heroBadgeLabel}>sin leer</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
            <View style={styles.filterRow}>
                <View style={styles.filterTabs}>
                    <FilterTab label="Todas" active={filter === 'all'} onPress={() => setFilter('all')} />
                    <FilterTab
                        label={`No leídas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                        active={filter === 'unread'}
                        onPress={() => setFilter('unread')}
                    />
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.85} style={styles.markAllBtn}>
                        <MaterialCommunityIcons name="check-all" size={14} color="#4A6CF7" />
                        <Text style={styles.markAllBtnText}>Marcar todo</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    const ListEmpty = !notificationsLoaded ? (
        <View>{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} shimmer={shimmer} />)}</View>
    ) : (
        <View style={styles.emptyWrapper}>
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyDecoCard}
            >
                <View style={styles.emptyDecoCircle} />
                <MaterialCommunityIcons name="bell-sleep-outline" size={36} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'Todo al día' : 'Sin notificaciones'}
            </Text>
            <Text style={styles.emptyText}>
                {filter === 'unread'
                    ? 'No tienes notificaciones pendientes de leer.'
                    : 'Cuando el supervisor te asigne una tarea, aparecerá aquí.'}
            </Text>
            {filter === 'unread' && (
                <TouchableOpacity onPress={() => setFilter('all')} activeOpacity={0.85} style={styles.emptyAction}>
                    <Text style={styles.emptyActionText}>Ver todas</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.content}
            data={displayedNotifications}
            keyExtractor={(item) => String(item.id)}
            refreshing={isLoading && notificationsLoaded}
            onRefresh={() => { setVisibleCount(10); refreshNotifications().catch(() => {}); }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            windowSize={5}
            onEndReached={() => { if (hasMore) setVisibleCount((c) => c + 10); }}
            onEndReachedThreshold={0.4}
            scrollEventThrottle={16}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
                { useNativeDriver: false }
            )}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
            ListFooterComponent={hasMore ? (
                <View style={styles.footerDots}>
                    <MaterialCommunityIcons name="dots-horizontal" size={22} color="#C7D2FE" />
                </View>
            ) : null}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            renderItem={({ item: notification }) => {
                const type = getNotificationType(notification);
                const isNavigable = !!(notification.taskId || notification.incidentId || notification.notificationType === 'week_summary');
                return (
                    <TouchableOpacity
                        onPress={() => handleOpen(notification)}
                        activeOpacity={0.85}
                        style={styles.card}
                    >
                        {!notification.isRead && <View style={[styles.unreadStripe, { backgroundColor: type.stripe }]} />}
                        <View style={styles.cardInner}>
                            <View style={styles.cardTopRow}>
                                <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
                                    <Text style={[styles.typeBadgeText, { color: type.text }]}>{type.label}</Text>
                                </View>
                                <Text style={styles.timestamp}>{formatRelativeDate(notification.createdAt)}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{notification.title}</Text>
                            <Text style={styles.cardBody} numberOfLines={2}>{notification.body}</Text>
                            <View style={styles.cardBottomRow}>
                                {notification.location ? (
                                    <View style={styles.locationChip}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#8F95B2" />
                                        <Text style={styles.locationText} numberOfLines={1}>{notification.location}</Text>
                                    </View>
                                ) : (
                                    <View />
                                )}
                                {isNavigable && (
                                    <TouchableOpacity onPress={() => handleOpen(notification)} activeOpacity={0.85} style={styles.actionBtn}>
                                        <Text style={styles.actionBtnText}>
                                            {notification.notificationType === 'week_summary' ? 'Ver semana' : 'Ver'}
                                        </Text>
                                        <MaterialCommunityIcons name="arrow-right" size={13} color="#4A6CF7" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            }}
        />
        {showMinimap && (
            <Animated.View
                pointerEvents="none"
                style={[mm.track, { top: 8, bottom: 8 }]}
            >
                <Animated.View
                    style={[mm.indicator, {
                        height: indicatorHeight,
                        transform: [{ translateY: indicatorTop }],
                    }]}
                />
            </Animated.View>
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEF2FF',
    },
    content: {
        paddingBottom: 40,
    },

    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },

    // Hero
    hero: {
        paddingTop: 64,
        paddingBottom: 28,
        paddingHorizontal: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    decCircle1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
    },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
    },
    heroBadgeNumber: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
    },
    heroBadgeLabel: {
        color: 'rgba(255,255,255,0.70)',
        fontSize: 11,
        fontWeight: '600',
    },

    // Filtros
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    filterTabs: {
        flexDirection: 'row',
        gap: 10,
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E8EDFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    markAllBtnText: {
        color: '#4A6CF7',
        fontSize: 12,
        fontWeight: '700',
    },
    filterTabWrapper: {
        borderRadius: 999,
        overflow: 'hidden',
    },
    filterTabActive: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 999,
    },
    filterTabActiveText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    filterTabInactive: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        paddingVertical: 9,
        shadowColor: '#4A6CF7',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    filterTabInactiveText: {
        color: '#8F95B2',
        fontSize: 13,
        fontWeight: '600',
    },

    // Card
    card: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#4A6CF7',
        shadowOpacity: 0.09,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    unreadStripe: {
        width: 4,
        backgroundColor: '#4A6CF7',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },
    cardInner: {
        flex: 1,
        padding: 16,
        gap: 6,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    typeBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    timestamp: {
        color: '#8F95B2',
        fontSize: 12,
        fontWeight: '500',
    },
    cardTitle: {
        color: '#1A1F36',
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 20,
    },
    cardBody: {
        color: '#8F95B2',
        fontSize: 13,
        lineHeight: 19,
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    locationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F3FF',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
        maxWidth: '60%',
    },
    locationText: {
        color: '#8F95B2',
        fontSize: 11,
        fontWeight: '600',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E8EDFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    actionBtnText: {
        color: '#4A6CF7',
        fontSize: 12,
        fontWeight: '700',
    },

    // Empty
    emptyWrapper: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 32,
        gap: 16,
    },
    emptyDecoCard: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 8,
        shadowColor: '#2D3FE0',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    emptyDecoCircle: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    emptyTitle: {
        color: '#1A1F36',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptyText: {
        color: '#8F95B2',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
    emptyAction: {
        backgroundColor: '#E8EDFF',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 4,
    },
    emptyActionText: {
        color: '#4A6CF7',
        fontSize: 13,
        fontWeight: '700',
    },

    // Footer
    footerDots: {
        alignItems: 'center',
        paddingVertical: 16,
    },

    // Skeleton
    skeletonLine: {
        height: 13,
        borderRadius: 6,
        backgroundColor: '#E8EDFF',
    },
    skeletonPill: {
        height: 24,
        borderRadius: 999,
        backgroundColor: '#E8EDFF',
    },
});

const mm = StyleSheet.create({
    track: {
        position: 'absolute',
        right: 4,
        width: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(74,108,247,0.10)',
    },
    indicator: {
        width: 4,
        borderRadius: 2,
        backgroundColor: '#4A6CF7',
        opacity: 0.55,
    },
});
