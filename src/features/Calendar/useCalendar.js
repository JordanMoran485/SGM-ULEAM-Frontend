import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import {
    firstRole, isTaskForCurrentUser, hasScheduledDate, getDateSource,
    getDateKey, formatDateLabel, formatDateLong,
    getSectionBadgeLabel, getSectionBadgeColor, compareSectionKeys,
    getTodayReference, toEcuadorStr, buildEcWeekDays, buildScheduleHtml,
    ecAddDays, ecAddMonths, STATUS_ORDER,
} from './helpers';

export function useCalendar() {
    const toast = useToast();
    const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();
    const isConcierge = firstRole(user) === 'conserje';
    const { weekMode, weekStart } = useLocalSearchParams();

    const [selectedDate, setSelectedDate]       = useState(() => toEcuadorStr(new Date()));
    const [weekAnchor, setWeekAnchor]           = useState(() => toEcuadorStr(new Date()));
    const [isMonthExpanded, setIsMonthExpanded] = useState(false);
    const [viewMode, setViewMode]               = useState('day');
    const [isExporting, setIsExporting]         = useState(false);
    const contentOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!tasksLoaded) {
            refreshTasks().catch((err) =>
                toast.error('Error al cargar calendario', err?.message || 'No se pudieron cargar las tareas.')
            );
        }
    }, [tasksLoaded, refreshTasks]);

    useFocusEffect(
        useCallback(() => {
            const today = toEcuadorStr(new Date());
            setSelectedDate(today);
            if (weekMode !== '1') setWeekAnchor(today);
        }, [weekMode])
    );

    useEffect(() => {
        if (weekMode === '1') {
            setViewMode('week');
            if (weekStart && /^\d{4}-\d{2}-\d{2}$/.test(String(weekStart))) {
                setWeekAnchor(String(weekStart));
            }
        }
    }, [weekMode, weekStart]);

    useEffect(() => {
        contentOpacity.setValue(0);
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, [selectedDate, viewMode]);

    const toggleMonthView = useCallback(() => {
        if (Platform.OS === 'android') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsMonthExpanded((v) => !v);
    }, []);

    const visibleItems = useMemo(() => {
        const source = isConcierge ? tasks.filter((t) => isTaskForCurrentUser(t, user)) : tasks;
        return source.filter((t) => hasScheduledDate(t)).sort((a, b) => {
            const diff = new Date(getDateSource(a) || 0).getTime() - new Date(getDateSource(b) || 0).getTime();
            return diff !== 0 ? diff : (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        });
    }, [tasks, isConcierge, user]);

    const todayReference = useMemo(() => getTodayReference(), []);
    const todayKey       = useMemo(() => toEcuadorStr(new Date()), []);
    const weekDays       = useMemo(() => buildEcWeekDays(weekAnchor), [weekAnchor]);

    const sections = useMemo(() => {
        const grouped = visibleItems.reduce((acc, item) => {
            const key = getDateKey(getDateSource(item));
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
        return Object.entries(grouped)
            .sort(([a], [b]) => compareSectionKeys(a, b, todayReference))
            .map(([dateKey, items]) => ({
                dateKey,
                label:      formatDateLabel(dateKey),
                longLabel:  formatDateLong(dateKey),
                badgeLabel: getSectionBadgeLabel(dateKey, todayReference),
                badgeColor: getSectionBadgeColor(dateKey, todayReference),
                items,
            }));
    }, [visibleItems, todayReference]);

    const activeSection = useMemo(
        () => sections.find((s) => s.dateKey === selectedDate) ?? null,
        [sections, selectedDate]
    );

    const pendingCount    = visibleItems.filter((t) => t.status === 'pending').length;
    const inProgressCount = visibleItems.filter((t) => t.status === 'in_progress').length;

    const exportSchedule = useCallback(async () => {
        if (!visibleItems.length) { toast.info('Sin tareas', 'No hay tareas programadas para exportar.'); return; }
        const safeName = [user?.name, user?.lastname].filter(Boolean).join('-').toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'conserje';
        const dateStamp = toEcuadorStr(new Date());
        const html = buildScheduleHtml(visibleItems, user, viewMode === 'week' ? weekAnchor : selectedDate);
        setIsExporting(true);
        try {
            if (Platform.OS === 'web') { await Print.printAsync({ html }); return; }
            const filename = `Horario-${safeName}-${dateStamp}.pdf`;
            const pdf      = await Print.printToFileAsync({ html, base64: false });
            const destUri  = FileSystem.cacheDirectory + filename;
            await FileSystem.moveAsync({ from: pdf.uri, to: destUri });
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) { toast.warning('No disponible', 'Este dispositivo no permite compartir PDFs.'); return; }
            await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
        } catch (err) {
            toast.error('Error al exportar', err?.message || 'No se pudo generar el horario.');
        } finally {
            setIsExporting(false);
        }
    }, [visibleItems, user, viewMode, weekAnchor, selectedDate, toast]);

    return {
        user, isConcierge, tasksLoaded,
        selectedDate, setSelectedDate,
        weekAnchor, setWeekAnchor,
        isMonthExpanded, toggleMonthView,
        viewMode, setViewMode,
        isExporting, exportSchedule,
        visibleItems, sections, activeSection,
        todayKey, weekDays,
        pendingCount, inProgressCount,
        contentOpacity,
        navPrev: () => isMonthExpanded ? setWeekAnchor((p) => ecAddMonths(p, -1)) : setWeekAnchor((p) => ecAddDays(p, -7)),
        navNext: () => isMonthExpanded ? setWeekAnchor((p) => ecAddMonths(p, 1))  : setWeekAnchor((p) => ecAddDays(p, 7)),
    };
}
