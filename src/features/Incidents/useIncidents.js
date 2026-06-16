import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { getEffectiveStatus } from './helpers';

export function useIncidents() {
    const toast = useToast();
    const { incidents, refreshIncidents, incidentsLoaded } = useAppContext();

    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing]     = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const [contentHeight, setContentHeight] = useState(1);
    const [listHeight, setListHeight]       = useState(1);
    const scrollAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!incidentsLoaded) {
            refreshIncidents().catch((err) => toast.error('Error al cargar datos', err?.message));
        }
    }, [incidentsLoaded, refreshIncidents]);

    useEffect(() => { setVisibleCount(10); }, [search, statusFilter]);

    const counts = useMemo(() => {
        const result = { all: incidents.length, pending: 0, in_progress: 0, revisada: 0, rechazada: 0, completed: 0 };
        incidents.forEach((item) => {
            const ef = getEffectiveStatus(item.status, item.approvalStatus);
            if (result[ef] !== undefined) result[ef] += 1;
        });
        return result;
    }, [incidents]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toUpperCase();
        return incidents
            .filter((item) => {
                if (statusFilter === 'all') return true;
                return getEffectiveStatus(item.status, item.approvalStatus) === statusFilter;
            })
            .filter((item) => {
                if (!query) return true;
                const searchable = [
                    item.title, item.description, item.location,
                    item.assignedCleanerName, item.priority,
                    ...(item.tasks || []).map((t) => t.title),
                ].filter(Boolean).join(' ').toUpperCase();
                return searchable.includes(query);
            });
    }, [incidents, search, statusFilter]);

    const displayedItems = filteredItems.slice(0, visibleCount);
    const hasMore        = displayedItems.length < filteredItems.length;

    const refreshScreen = useCallback(async () => {
        setRefreshing(true);
        setVisibleCount(10);
        setSearch('');
        try {
            await refreshIncidents();
        } catch (err) {
            toast.error('Error al actualizar datos', err?.message);
        } finally {
            setRefreshing(false);
        }
    }, [refreshIncidents, toast]);

    const loadMore = useCallback(() => {
        if (hasMore) setVisibleCount((c) => c + 10);
    }, [hasMore]);

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
        incidents, incidentsLoaded,
        search, setSearch,
        statusFilter, setStatusFilter,
        refreshing, refreshScreen,
        counts, filteredItems, displayedItems, hasMore, loadMore,
        visibleCount, setVisibleCount,
        scrollAnim,
        onContentSizeChange: (_, h) => setContentHeight(h),
        onLayout:            (e) => setListHeight(e.nativeEvent.layout.height),
        showMinimap, indicatorHeight, indicatorTop,
    };
}
