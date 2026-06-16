import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useShimmer } from '../../hooks/useShimmer';
import { useFocusEffect } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { API_BASE_URL } from '../../services/api';

function toEcuadorStr(d) {
    const ec = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    return `${ec.getUTCFullYear()}-${String(ec.getUTCMonth() + 1).padStart(2, '0')}-${String(ec.getUTCDate()).padStart(2, '0')}`;
}

export function useDashboard() {
    const toast = useToast();
    const {
        user, stats, incidents, incidentsLoaded, refreshIncidents,
        tasks, tasksLoaded, refreshTasks, notifications,
    } = useAppContext();

    const shimmer     = useShimmer();
    const barProgress = useRef(new Animated.Value(0)).current;

    const animateBars = useCallback(() => {
        barProgress.setValue(0);
        Animated.timing(barProgress, {
            toValue: 1, duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [barProgress]);

    useEffect(() => {
        if (!tasksLoaded) {
            console.log('Dashboard API base URL:', API_BASE_URL);
            refreshTasks().catch((err) => {
                toast.error('Error al cargar', err?.message || 'No se pudieron cargar las tareas.');
            });
        }
        if (!incidentsLoaded) {
            refreshIncidents().catch((err) => console.error('Error incidencias:', err));
        }
    }, [incidentsLoaded, refreshIncidents, tasksLoaded, refreshTasks]);

    useEffect(() => {
        if (tasksLoaded && incidentsLoaded) animateBars();
    }, [tasksLoaded, incidentsLoaded, animateBars]);

    useFocusEffect(
        useCallback(() => {
            if (tasksLoaded && incidentsLoaded) animateBars();
        }, [tasksLoaded, incidentsLoaded, animateBars])
    );


    const userName    = user?.name || 'Usuario';
    const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

    const recentActivity = useMemo(() =>
        [...incidents]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 4),
        [incidents]
    );

    const ecuadorToday = toEcuadorStr(new Date());
    const [ey, em, ed] = ecuadorToday.split('-').map(Number);
    const todayIndex   = (new Date(Date.UTC(ey, em - 1, ed, 12)).getUTCDay() + 6) % 7;

    const { weeklyData, weekTotal, prevWeekTotal } = useMemo(() => {
        const labels     = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
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
            const ds  = toEcuadorStr(d);
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

    const { incWeeklyData, incWeekTotal } = useMemo(() => {
        const labels   = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        const counts   = [0, 0, 0, 0, 0, 0, 0];
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(Date.UTC(ey, em - 1, ed + i - todayIndex, 12));
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        });

        incidents.forEach((inc) => {
            const raw = String(inc.createdAt || '');
            if (!raw) return;
            const s = /Z|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z';
            const d = new Date(s);
            if (isNaN(d)) return;
            const idx = weekDays.indexOf(toEcuadorStr(d));
            if (idx !== -1) counts[idx]++;
        });

        return {
            incWeeklyData: labels.map((label, i) => ({ label, count: counts[i] })),
            incWeekTotal:  counts.reduce((a, b) => a + b, 0),
        };
    }, [incidents, todayIndex, ey, em, ed]);

    return {
        user, stats, incidentsLoaded, tasksLoaded,
        shimmer, barProgress,
        chartMax:    Math.max(...weeklyData.map((d) => d.count), 1),
        incChartMax: Math.max(...incWeeklyData.map((d) => d.count), 1),
        todayIndex,
        weeklyData, weekTotal, prevWeekTotal,
        incWeeklyData, incWeekTotal,
        recentActivity,
        userName, unreadCount,
    };
}
