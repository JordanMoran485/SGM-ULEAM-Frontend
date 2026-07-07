import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { getApiErrorMessage } from '../../services/api';
import { firstRole, isTaskForCurrentUser } from './helpers';

export function useTasks() {
    const { error: toastError } = useToast();
    const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();

    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing]     = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const [contentHeight, setContentHeight] = useState(1);
    const [listHeight, setListHeight]       = useState(1);
    const scrollAnim = useRef(new Animated.Value(0)).current;

    const isConserje = firstRole(user) === 'conserje';

    useEffect(() => {
        if (!tasksLoaded) {
            refreshTasks().catch((err) =>
                toastError('Error al cargar tareas', getApiErrorMessage(err))
            );
        }
    }, [tasksLoaded, refreshTasks, toastError]);

    useEffect(() => { setVisibleCount(10); }, [search, statusFilter]);

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

    const displayedTasks = visibleTasks.slice(0, visibleCount);
    const hasMore        = displayedTasks.length < visibleTasks.length;

    const refreshScreen = useCallback(async () => {
        setRefreshing(true);
        setVisibleCount(10);
        try { await refreshTasks(); }
        catch (err) { toastError('Error', getApiErrorMessage(err)); }
        finally { setRefreshing(false); }
    }, [refreshTasks, toastError]);

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
        user, tasks, tasksLoaded, isConserje,
        search, setSearch,
        statusFilter, setStatusFilter,
        refreshing, refreshScreen,
        counts, visibleTasks, displayedTasks, hasMore, loadMore,
        scrollAnim,
        onContentSizeChange: (_, h) => setContentHeight(h),
        onLayout:            (e)    => setListHeight(e.nativeEvent.layout.height),
        showMinimap, indicatorHeight, indicatorTop,
        screenTitle: isConserje ? 'Mis tareas' : 'Tareas asignadas',
    };
}
