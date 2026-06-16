import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { useShimmer } from '../../hooks/useShimmer';
import { parseWeekLabel } from './helpers';

export function useNotifications() {
    const toast  = useToast();
    const router = useRouter();
    const {
        notifications, notificationsLoaded, refreshNotifications,
        markNotificationRead, markAllNotificationsRead, isLoading,
    } = useAppContext();

    const shimmer    = useShimmer();
    const scrollAnim = useRef(new Animated.Value(0)).current;

    const [filter, setFilter]               = useState('all');
    const [visibleCount, setVisibleCount]   = useState(10);
    const [contentHeight, setContentHeight] = useState(1);
    const [listHeight, setListHeight]       = useState(1);

    useEffect(() => {
        if (!notificationsLoaded) {
            refreshNotifications().catch((err) => {
                toast.error('Error', err?.message || 'No se pudieron cargar las notificaciones.');
            });
        }
    }, [notificationsLoaded, refreshNotifications]);

    useEffect(() => { setVisibleCount(10); }, [filter]);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await markAllNotificationsRead();
        } catch (err) {
            toast.error('Error', err?.message || 'No se pudieron marcar las notificaciones.');
        }
    }, [markAllNotificationsRead, toast]);

    const handleOpen = useCallback(async (notification) => {
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
    }, [markNotificationRead, router]);

    const onRefresh = useCallback(() => {
        setVisibleCount(10);
        refreshNotifications().catch(() => {});
    }, [refreshNotifications]);

    const loadMore = useCallback(() => {
        setVisibleCount((c) => c + 10);
    }, []);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const visible     = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
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

    return {
        notifications, notificationsLoaded, isLoading,
        shimmer, scrollAnim,
        filter, setFilter,
        unreadCount,
        displayedNotifications, hasMore,
        onRefresh, loadMore,
        handleOpen, handleMarkAllRead,
        onContentSizeChange: (_, h) => setContentHeight(h),
        onLayout:            (e)    => setListHeight(e.nativeEvent.layout.height),
        showMinimap, indicatorHeight, indicatorTop,
    };
}
