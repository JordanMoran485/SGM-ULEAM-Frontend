import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAppContext } from "../../src/context/AppContext";
import { useToast } from "../../src/components/Toast";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_ORDER = { pending: 0, in_progress: 1, completed: 2, resolved: 2, cancelled: 3 };

function firstRole(user) {
    if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
    return user?.role || user?.cargo || null;
}

function getStatusConfig(status) {
    if (status === "completed" || status === "resolved")
        return { stripe: "#22C55E", bg: "#DCFCE7", color: "#16A34A", label: "Completada" };
    if (status === "in_progress")
        return { stripe: "#4A6CF7", bg: "#E8EDFF", color: "#2D3FE0", label: "En progreso" };
    return { stripe: "#F59E0B", bg: "#FEF3C7", color: "#D97706", label: "Pendiente" };
}

function getDateSource(item) { return item.startAt || item.dueDate || item.updatedAt || item.createdAt || null; }
function hasScheduledDate(item) { return Boolean(item?.startAt || item?.dueDate); }
function getDateKey(rawDate) {
    if (!rawDate) return "Sin fecha";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return "Sin fecha";
    return parsed.toISOString().slice(0, 10);
}
function formatDateLabel(dateKey) {
    if (dateKey === "Sin fecha") return dateKey;
    return new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "short" })
        .format(new Date(`${dateKey}T12:00:00`));
}
function formatDateLong(dateKey) {
    if (dateKey === "Sin fecha") return "Tareas sin fecha asignada";
    return new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${dateKey}T12:00:00`));
}
function getTodayReference() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function getDateRelation(dateKey, today = getTodayReference()) {
    if (dateKey === "Sin fecha") return "undated";
    const parsed = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return "undated";
    parsed.setHours(0, 0, 0, 0);
    if (parsed.getTime() < today.getTime()) return "past";
    if (parsed.getTime() === today.getTime()) return "today";
    return "upcoming";
}
function getSectionBadgeLabel(dateKey, today = getTodayReference()) {
    const r = getDateRelation(dateKey, today);
    if (r === "today") return "Hoy";
    if (r === "upcoming") return "Próxima";
    if (r === "past") return "Pasada";
    return "Sin fecha";
}
function getSectionBadgeColor(dateKey, today = getTodayReference()) {
    const r = getDateRelation(dateKey, today);
    if (r === "today") return { bg: "#E8EDFF", color: "#2D3FE0" };
    if (r === "upcoming") return { bg: "#DCFCE7", color: "#16A34A" };
    if (r === "past") return { bg: "#FEF3C7", color: "#D97706" };
    return { bg: "#F1F3FF", color: "#8F95B2" };
}
function compareSectionKeys(left, right, today = getTodayReference()) {
    const order = { today: 0, upcoming: 1, past: 2, undated: 3 };
    const diff = order[getDateRelation(left, today)] - order[getDateRelation(right, today)];
    if (diff !== 0) return diff;
    if (getDateRelation(left, today) === "upcoming") return left.localeCompare(right);
    if (getDateRelation(left, today) === "past") return right.localeCompare(left);
    return left.localeCompare(right);
}
function pickInitialDateKey(sections, today = getTodayReference()) {
    const todayKey = today.toISOString().slice(0, 10);
    if (sections.some((s) => s.dateKey === todayKey)) return todayKey;
    const next = sections.find((s) => getDateRelation(s.dateKey, today) === "upcoming");
    if (next) return next.dateKey;
    const past = sections.find((s) => getDateRelation(s.dateKey, today) === "past");
    if (past) return past.dateKey;
    return sections[0]?.dateKey ?? null;
}
function isTaskForCurrentUser(item, user) {
    if (!user) return false;
    const fullName = [user.name, user.lastname].filter(Boolean).join(" ").trim().toUpperCase();
    const assigned = (item.assignedCleanerName || "").trim().toUpperCase();
    return String(item.userId || "") === String(user.id || "") || (fullName && assigned && fullName === assigned);
}
function escapeHtml(v) {
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Ecuador (UTC-5) — igual que Dashboard, sin depender del timezone del dispositivo
function toEcuadorStr(d) {
    const ec = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    return `${ec.getUTCFullYear()}-${String(ec.getUTCMonth() + 1).padStart(2, "0")}-${String(ec.getUTCDate()).padStart(2, "0")}`;
}
function ecAddDays(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const u = new Date(Date.UTC(y, m - 1, d + n, 12));
    return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, "0")}-${String(u.getUTCDate()).padStart(2, "0")}`;
}
function ecAddMonths(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const u = new Date(Date.UTC(y, m - 1 + n, d, 12));
    return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, "0")}-${String(u.getUTCDate()).padStart(2, "0")}`;
}
function ecStartOfWeek(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0=Dom
    return ecAddDays(dateStr, -((dow + 6) % 7));
}
function buildEcWeekDays(anchorStr) {
    const mon = ecStartOfWeek(anchorStr);
    return Array.from({ length: 7 }, (_, i) => ecAddDays(mon, i));
}
function buildEcMonthGrid(anchorStr) {
    const [y, m] = anchorStr.split("-").map(Number);
    const firstDay = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastUTC  = new Date(Date.UTC(y, m, 0));
    const lastDay  = `${lastUTC.getUTCFullYear()}-${String(lastUTC.getUTCMonth() + 1).padStart(2, "0")}-${String(lastUTC.getUTCDate()).padStart(2, "0")}`;
    const start    = ecStartOfWeek(firstDay);
    const days = [];
    let cur = start;
    while (cur <= lastDay || days.length % 7 !== 0) {
        days.push(cur);
        cur = ecAddDays(cur, 1);
        if (days.length >= 42) break;
    }
    return { days, month: m };
}
function ecDayName(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return DAY_NAMES[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
}
function ecDayNum(dateStr)   { return Number(dateStr.split("-")[2]); }
function ecMonthNum(dateStr) { return Number(dateStr.split("-")[1]); }
function ecMonthYearLabel(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric" })
        .format(new Date(Date.UTC(y, m - 1, d, 12)))
        .replace(/^\w/, (c) => c.toUpperCase());
}

function startOfWeek(date) {
    const d = new Date(date); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0, 0, 0, 0); return d;
}
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function formatDayHeader(date) {
    return new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "short" }).format(date);
}
function formatTimeLabel(h) { return `${String(h).padStart(2,"0")}:00 - ${String(h+1).padStart(2,"0")}:00`; }
function buildWeekDays(anchor) { const ws = startOfWeek(anchor); return Array.from({length:7},(_,i)=>addDays(ws,i)); }
function getTaskStart(item) {
    const raw = item.startAt || item.dueDate || item.createdAt;
    if (!raw) return null;
    const p = new Date(raw); if (isNaN(p)) return null;
    if (!item.startAt && item.dueDate) p.setHours(6,0,0,0);
    return p;
}
function getTaskEnd(item) {
    const s = getTaskStart(item); if (!s) return null;
    if (item.endAt) { const p = new Date(item.endAt); if (!isNaN(p)) return p; }
    const e = new Date(s); e.setHours(s.getHours()+1,s.getMinutes(),0,0); return e;
}
function taskBelongsToSlot(task, dayDate, hour) {
    const start = getTaskStart(task);
    if (!start || !sameDay(start, dayDate)) return false;
    if (task.allDay) return hour === 6;
    const end = getTaskEnd(task) || start;
    const ss = new Date(dayDate); ss.setHours(hour,0,0,0);
    const se = new Date(dayDate); se.setHours(hour+1,0,0,0);
    return start < se && end > ss;
}
function buildScheduleHtml(items, user, selectedDate) {
    const anchorStr  = (selectedDate && selectedDate !== "Sin fecha") ? selectedDate : toEcuadorStr(new Date());
    const monStr     = ecStartOfWeek(anchorStr);
    const weekDays   = Array.from({ length: 7 }, (_, i) => {
        const s = ecAddDays(monStr, i);
        const [y, m, d] = s.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12));
    });
    const hourSlots    = Array.from({ length: 14 }, (_, i) => 6 + i);
    const headerCells  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => `<th>${escapeHtml(d)}</th>`).join("");

    const bodyRows = hourSlots.map((hour) => {
        const dayCells = weekDays.map((dayDate) => {
            const slotTasks = items.filter((t) => taskBelongsToSlot(t, dayDate, hour));
            const content = slotTasks.length
                ? slotTasks.map((t) => `<div class="task-card ${t.allDay ? "all-day" : ""}"><div class="task-title">${escapeHtml(t.title || "Tarea sin título")}</div></div>`).join("")
                : `<div class="empty-slot"></div>`;
            return `<td>${content}</td>`;
        }).join("");
        return `<tr><th class="hour-cell">${escapeHtml(formatTimeLabel(hour))}</th>${dayCells}</tr>`;
    }).join("");

    return `<html><head><meta charset="utf-8"/><style>
        @page{size:A4 landscape;margin:8mm}
        body{font-family:Arial,sans-serif;color:#1A1F36;padding:0;margin:0}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th{background:#E8EDFF;color:#2D3FE0;font-size:11px;text-transform:uppercase;letter-spacing:.4px;text-align:center}
        th,td{border:1px solid #E8EDFF;padding:3px;vertical-align:top;font-size:10px}
        .hour-cell{width:68px;background:#F1F3FF;font-weight:bold;text-align:left}
        td{height:44px;background:#fff}
        .task-card{background:#E8EDFF;border-left:3px solid #4A6CF7;border-radius:4px;padding:3px 4px;margin-bottom:2px}
        .task-card.all-day{background:#FEF3C7;border-left-color:#F59E0B}
        .task-title{font-size:9px;font-weight:bold;color:#1A1F36;line-height:1.15}
        .empty-slot{min-height:34px}
    </style></head><body>
        <table><thead><tr><th class="hour-cell">Hora</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    </body></html>`;
}

const DAY_NAMES   = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
}
function getMonthGrid(anchor) {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth  = new Date(year, month + 1, 0);
    const start = startOfWeek(firstOfMonth);
    const days = [];
    let cur = new Date(start);
    while (cur <= lastOfMonth || days.length % 7 !== 0) {
        days.push(new Date(cur));
        cur = addDays(cur, 1);
        if (days.length >= 42) break;
    }
    return { days, month };
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState(() => toEcuadorStr(new Date()));
    const [isExporting, setIsExporting]   = useState(false);
    const router = useRouter();
    const toast = useToast();
    const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();
    const isConcierge = firstRole(user) === "conserje";
    const [weekAnchor, setWeekAnchor]       = useState(() => toEcuadorStr(new Date()));
    const [isMonthExpanded, setIsMonthExpanded] = useState(false);
    const { weekMode, weekStart } = useLocalSearchParams();
    const [viewMode, setViewMode] = useState('day');

    useEffect(() => {
        if (!tasksLoaded) {
            refreshTasks().catch((err) =>
                toast.error("Error al cargar calendario", err?.message || "No se pudieron cargar las tareas.")
            );
        }
    }, [tasksLoaded, refreshTasks]);

    const visibleItems = useMemo(() => {
        const source = isConcierge ? tasks.filter((t) => isTaskForCurrentUser(t, user)) : tasks;
        return source.filter((t) => hasScheduledDate(t)).sort((a, b) => {
            const diff = new Date(getDateSource(a)||0).getTime() - new Date(getDateSource(b)||0).getTime();
            return diff !== 0 ? diff : (STATUS_ORDER[a.status]??99) - (STATUS_ORDER[b.status]??99);
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
            .sort(([a],[b]) => compareSectionKeys(a, b, todayReference))
            .map(([dateKey, items]) => ({
                dateKey,
                label: formatDateLabel(dateKey),
                longLabel: formatDateLong(dateKey),
                badgeLabel: getSectionBadgeLabel(dateKey, todayReference),
                badgeColor: getSectionBadgeColor(dateKey, todayReference),
                items,
            }));
    }, [visibleItems, todayReference]);

    useEffect(() => {
        if (!selectedDate)
            setSelectedDate(toEcuadorStr(new Date()));
    }, [sections, selectedDate]);

    useFocusEffect(
        useCallback(() => {
            const today = toEcuadorStr(new Date());
            setSelectedDate(today);
            if (weekMode !== '1') {
                setWeekAnchor(today);
            }
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

    const activeSection = useMemo(
        () => sections.find((s) => s.dateKey === selectedDate) ?? null,
        [sections, selectedDate]
    );

    const pendingCount    = visibleItems.filter((t) => t.status === "pending").length;
    const inProgressCount = visibleItems.filter((t) => t.status === "in_progress").length;

    const exportSchedule = async () => {
        if (!visibleItems.length) { toast.info("Sin tareas", "No hay tareas programadas para exportar."); return; }
        const safeName = [user?.name, user?.lastname].filter(Boolean).join("-").toLowerCase()
            .replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"") || "conserje";
        const dateStamp = toEcuadorStr(new Date());
        const html = buildScheduleHtml(visibleItems, user, viewMode === 'week' ? weekAnchor : selectedDate);
        setIsExporting(true);
        try {
            if (Platform.OS === "web") { await Print.printAsync({ html }); return; }
            const filename = `Horario-${safeName}-${dateStamp}.pdf`;
            const pdf      = await Print.printToFileAsync({ html, base64: false });
            const destUri  = FileSystem.cacheDirectory + filename;
            await FileSystem.moveAsync({ from: pdf.uri, to: destUri });
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) { toast.warning("No disponible", "Este dispositivo no permite compartir PDFs."); return; }
            await Sharing.shareAsync(destUri, {
                mimeType: "application/pdf",
                dialogTitle: filename,
                UTI: "com.adobe.pdf",
            });
        } catch (err) {
            toast.error("Error al exportar", err?.message || "No se pudo generar el horario.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* ── Hero ── */}
            <LinearGradient
                colors={["#2D3FE0", "#4A6CF7", "#7B9FFF"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroDeco1} />
                <View style={styles.heroDeco2} />

                <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.heroRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroEyebrow}>AGENDA OPERATIVA</Text>
                        <Text style={styles.heroTitle}>Calendario</Text>
                    </View>
                </View>

                {/* Stat cards al filo */}
                <View style={styles.statRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#E8EDFF" }]}>
                            <MaterialCommunityIcons name="calendar-check-outline" size={17} color="#4A6CF7" />
                        </View>
                        <Text style={styles.statNum}>{visibleItems.length}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
                            <MaterialCommunityIcons name="clock-outline" size={17} color="#F59E0B" />
                        </View>
                        <Text style={styles.statNum}>{pendingCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>Pendientes</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#E8F8FB" }]}>
                            <MaterialCommunityIcons name="progress-clock" size={17} color="#06B6D4" />
                        </View>
                        <Text style={styles.statNum}>{inProgressCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>En progreso</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Exportar ── */}
            <View style={styles.exportWrap}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.exportBtn}
                    onPress={exportSchedule}
                    disabled={isExporting}
                >
                    <LinearGradient
                        colors={["#2D3FE0", "#4A6CF7"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.exportBtnGradient}
                    >
                        <MaterialCommunityIcons
                            name={isExporting ? "loading" : "download-outline"}
                            size={18} color="#fff"
                        />
                        <Text style={styles.exportBtnText}>
                            {isExporting ? "Generando..." : isConcierge ? "Descargar mi horario" : "Descargar agenda"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ── Selector de calendario ── */}
            <View style={styles.weekCard}>

                {/* Header: flechas + mes/año + botón expandir */}
                <View style={styles.weekHeader}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.weekNavBtn}
                        onPress={() =>
                            isMonthExpanded
                                ? setWeekAnchor((prev) => ecAddMonths(prev, -1))
                                : setWeekAnchor((prev) => ecAddDays(prev, -7))
                        }
                    >
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#4A6CF7" />
                    </TouchableOpacity>

                    <Text style={styles.weekMonthLabel}>{ecMonthYearLabel(weekAnchor)}</Text>

                    <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[styles.weekNavBtn, isMonthExpanded && styles.weekNavBtnActive]}
                            onPress={() => setIsMonthExpanded((v) => !v)}
                        >
                            <MaterialCommunityIcons
                                name={isMonthExpanded ? "calendar-week" : "calendar-month-outline"}
                                size={22}
                                color={isMonthExpanded ? "#ffffff" : "#4A6CF7"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.weekNavBtn}
                            onPress={() =>
                                isMonthExpanded
                                    ? setWeekAnchor((prev) => ecAddMonths(prev, 1))
                                    : setWeekAnchor((prev) => ecAddDays(prev, 7))
                            }
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#4A6CF7" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isMonthExpanded ? (
                    /* ── Vista mensual ── */
                    <>
                        <View style={styles.monthDayHeaders}>
                            {DAY_HEADERS.map((h) => (
                                <Text key={h} style={styles.monthDayHeader}>{h}</Text>
                            ))}
                        </View>
                        <View style={styles.monthGrid}>
                            {buildEcMonthGrid(weekAnchor).days.map((key, i) => {
                                const isCurrentMonth = ecMonthNum(key) === ecMonthNum(weekAnchor);
                                const isSelected = key === selectedDate;
                                const isToday = key === todayKey;
                                const hasTasks = sections.some((s) => s.dateKey === key);

                                return (
                                    <TouchableOpacity
                                        key={key + i}
                                        activeOpacity={0.85}
                                        style={styles.monthDayCol}
                                        onPress={() => setSelectedDate(key)}
                                    >
                                        {isSelected ? (
                                            <LinearGradient
                                                colors={["#2D3FE0", "#4A6CF7"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={styles.monthDaySelected}
                                            >
                                                <Text style={styles.monthDayNumSelected}>{ecDayNum(key)}</Text>
                                                {hasTasks && isCurrentMonth && (
                                                    <View style={styles.monthDotSelected} />
                                                )}
                                            </LinearGradient>
                                        ) : (
                                            <View style={[
                                                styles.monthDayIdle,
                                                isToday && styles.monthDayTodayBg,
                                                !isCurrentMonth && { opacity: 0.28 },
                                            ]}>
                                                <Text style={[
                                                    styles.monthDayNum,
                                                    isToday && styles.monthDayNumToday,
                                                ]}>
                                                    {ecDayNum(key)}
                                                </Text>
                                                {hasTasks && isCurrentMonth && (
                                                    <View style={[styles.monthDot, isToday && styles.weekDotToday]} />
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                ) : (
                    /* ── Vista semanal ── */
                    <View style={styles.weekDaysRow}>
                        {weekDays.map((key) => {
                            const isSelected = key === selectedDate;
                            const isToday = key === todayKey;
                            const hasTasks = sections.some((s) => s.dateKey === key);

                            return (
                                <TouchableOpacity
                                    key={key}
                                    activeOpacity={0.85}
                                    style={styles.weekDayCol}
                                    onPress={() => setSelectedDate(key)}
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={["#2D3FE0", "#4A6CF7"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={styles.weekDaySelected}
                                        >
                                            <Text style={styles.weekDayNameSelected}>
                                                {ecDayName(key)}
                                            </Text>
                                            <Text style={styles.weekDayNumSelected}>{ecDayNum(key)}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[styles.weekDayIdle, isToday && styles.weekDayToday]}>
                                            <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                                                {ecDayName(key)}
                                            </Text>
                                            <Text style={[styles.weekDayNum, isToday && styles.weekDayNumToday]}>
                                                {ecDayNum(key)}
                                            </Text>
                                            {hasTasks && (
                                                <View style={[styles.weekDot, isToday && styles.weekDotToday]} />
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* ── Toggle vista ── */}
            <View style={styles.viewToggleRow}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewMode('day')} style={styles.viewToggleWrapper}>
                    {viewMode === 'day' ? (
                        <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewToggleActive}>
                            <MaterialCommunityIcons name="calendar-today" size={14} color="#fff" />
                            <Text style={styles.viewToggleActiveText}>Día</Text>
                        </LinearGradient>
                    ) : (
                        <View style={styles.viewToggleInactive}>
                            <MaterialCommunityIcons name="calendar-today" size={14} color="#8F95B2" />
                            <Text style={styles.viewToggleInactiveText}>Día</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewMode('week')} style={styles.viewToggleWrapper}>
                    {viewMode === 'week' ? (
                        <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewToggleActive}>
                            <MaterialCommunityIcons name="view-week-outline" size={14} color="#fff" />
                            <Text style={styles.viewToggleActiveText}>Semana</Text>
                        </LinearGradient>
                    ) : (
                        <View style={styles.viewToggleInactive}>
                            <MaterialCommunityIcons name="view-week-outline" size={14} color="#8F95B2" />
                            <Text style={styles.viewToggleInactiveText}>Semana</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {viewMode === 'week' ? (
                <View style={styles.weekViewContainer}>
                    {weekDays.map((dayKey) => {
                        const daySection = sections.find((s) => s.dateKey === dayKey);
                        const isToday = dayKey === todayKey;
                        const hasTasks = Boolean(daySection?.items?.length);

                        return (
                            <View key={dayKey} style={styles.weekViewBlock}>
                                <View style={styles.weekViewDayHeader}>
                                    {isToday ? (
                                        <LinearGradient
                                            colors={['#2D3FE0', '#4A6CF7']}
                                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                            style={styles.weekViewDayPillToday}
                                        >
                                            <Text style={styles.weekViewDayNameToday}>{ecDayName(dayKey)}</Text>
                                            <Text style={styles.weekViewDayNumToday}>{ecDayNum(dayKey)}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.weekViewDayPillIdle}>
                                            <Text style={styles.weekViewDayName}>{ecDayName(dayKey)}</Text>
                                            <Text style={styles.weekViewDayNum}>{ecDayNum(dayKey)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.weekViewDayLabel} numberOfLines={1}>{formatDateLong(dayKey)}</Text>
                                    </View>
                                    {hasTasks && (
                                        <View style={styles.weekViewCountPill}>
                                            <Text style={styles.weekViewCountText}>{daySection.items.length}</Text>
                                        </View>
                                    )}
                                </View>

                                {hasTasks ? (
                                    <View style={styles.weekViewTasks}>
                                        {daySection.items.map((item) => {
                                            const sc = getStatusConfig(item.status);
                                            return (
                                                <TouchableOpacity
                                                    key={String(item.id)}
                                                    activeOpacity={0.85}
                                                    style={styles.taskCard}
                                                    onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'task' } })}
                                                >
                                                    <View style={[styles.taskStripe, { backgroundColor: sc.stripe }]} />
                                                    <View style={styles.taskBody}>
                                                        <View style={[styles.taskTopRow, { justifyContent: 'space-between' }]}>
                                                            <View style={[styles.taskBadge, { backgroundColor: sc.bg }]}>
                                                                <Text style={[styles.taskBadgeText, { color: sc.color }]}>{sc.label}</Text>
                                                            </View>
                                                            {item.startAt && !item.allDay && (
                                                                <Text style={styles.taskTimeLabel}>
                                                                    {new Date(item.startAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
                                                        <View style={styles.taskMeta}>
                                                            <View style={styles.taskMetaChip}>
                                                                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#8F95B2" />
                                                                <Text style={styles.taskMetaText} numberOfLines={1}>{item.location || 'Sin ubicación'}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={styles.weekViewEmptyDay}>
                                        <View style={styles.weekViewEmptyLine} />
                                        <Text style={styles.weekViewEmptyText}>Sin tareas</Text>
                                        <View style={styles.weekViewEmptyLine} />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            ) : (
                activeSection ? (
                    <View style={styles.agendaCard}>
                        <View style={styles.agendaHeader}>
                            <View style={{ gap: 3 }}>
                                <Text style={styles.agendaEyebrow}>FECHA SELECCIONADA</Text>
                                <Text style={styles.agendaTitle}>{activeSection.longLabel}</Text>
                            </View>
                            <View style={styles.agendaCountPill}>
                                <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#4A6CF7" />
                                <Text style={styles.agendaCountText}>{activeSection.items.length}</Text>
                            </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: "#F1F3FF", marginBottom: 12 }} />

                        {activeSection.items.map((item) => {
                            const sc = getStatusConfig(item.status);
                            return (
                                <TouchableOpacity
                                    key={String(item.id)}
                                    activeOpacity={0.85}
                                    style={styles.taskCard}
                                    onPress={() => router.push({ pathname: "/IncidentDetail", params: { id: String(item.id), type: "task" } })}
                                >
                                    <View style={[styles.taskStripe, { backgroundColor: sc.stripe }]} />
                                    <View style={styles.taskBody}>
                                        <View style={styles.taskTopRow}>
                                            <View style={[styles.taskBadge, { backgroundColor: sc.bg }]}>
                                                <Text style={[styles.taskBadgeText, { color: sc.color }]}>{sc.label}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.taskDesc} numberOfLines={2}>
                                            {item.description || "Sin descripción registrada."}
                                        </Text>
                                        <View style={styles.taskMeta}>
                                            <View style={styles.taskMetaChip}>
                                                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#8F95B2" />
                                                <Text style={styles.taskMetaText} numberOfLines={1}>{item.location || "Sin ubicación"}</Text>
                                            </View>
                                            <View style={styles.taskMetaChip}>
                                                <MaterialCommunityIcons name="account-outline" size={12} color="#8F95B2" />
                                                <Text style={styles.taskMetaText} numberOfLines={1}>{item.assignedCleanerName || "Sin asignar"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <LinearGradient
                            colors={["#2D3FE0", "#4A6CF7", "#7B9FFF"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.emptyIconBox}
                        >
                            <View style={styles.emptyIconDeco} />
                            <MaterialCommunityIcons name="calendar-blank-outline" size={30} color="rgba(255,255,255,0.9)" />
                        </LinearGradient>
                        <Text style={styles.emptyTitle}>
                            {selectedDate ? "Sin tareas este día" : "Sin tareas programadas"}
                        </Text>
                        <Text style={styles.emptyBody}>
                            {selectedDate && selectedDate !== "Sin fecha"
                                ? formatDateLong(selectedDate)
                                : "Solo aparecen tareas que tienen fecha asignada."}
                        </Text>
                    </View>
                )
            )}
        </ScrollView>
    );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF2FF" },
    content:   { paddingBottom: 48 },

    // Hero
    hero: {
        paddingTop: 56, paddingBottom: 0, paddingHorizontal: 24,
        overflow: "hidden",
    },
    heroDeco1: {
        position: "absolute", top: -50, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    heroDeco2: {
        position: "absolute", bottom: -20, left: -30,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 16,
    },
    heroRow: {
        flexDirection: "row", alignItems: "flex-end",
        justifyContent: "space-between", marginBottom: 20,
    },
    heroEyebrow: {
        color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6,
    },
    heroTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
    heroBadge: {
        backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
    },
    heroBadgeNum:   { color: "#ffffff", fontSize: 22, fontWeight: "800" },
    heroBadgeLabel: { color: "rgba(255,255,255,0.70)", fontSize: 11, fontWeight: "600" },

    // Stat cards al filo del hero
    statRow: { flexDirection: "row", gap: 10 },
    statCard: {
        flex: 1, height: 104, backgroundColor: "#ffffff",
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        alignItems: "center", justifyContent: "center", gap: 6,
        shadowColor: "#2D3FE0", shadowOpacity: 0.14,
        shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    statIcon: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: "center", justifyContent: "center",
    },
    statNum:   { color: "#1A1F36", fontSize: 22, fontWeight: "800" },
    statLabel: { color: "#8F95B2", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

    // Exportar
    exportWrap: { paddingHorizontal: 20, paddingTop: 20 },
    exportBtn:  { borderRadius: 20, overflow: "hidden" },
    exportBtnGradient: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 9, paddingVertical: 15,
    },
    exportBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

    // Selector de fechas
    sectionHeader: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 12 },
    sectionTitle:  { color: "#1A1F36", fontSize: 17, fontWeight: "700" },
    daySelector:   { marginBottom: 20 },
    daySelectorContent: { paddingHorizontal: 20, gap: 10 },

    dayChipActive: {
        minWidth: 120, paddingHorizontal: 16, paddingVertical: 14,
        borderRadius: 20, gap: 4,
    },
    dayChipLabelActive: { color: "#ffffff", fontSize: 15, fontWeight: "800", textTransform: "capitalize" },
    dayChipBadgeActive: {
        alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginVertical: 2,
    },
    dayChipBadgeTextActive: { color: "#ffffff", fontSize: 10, fontWeight: "700" },
    dayChipCountActive: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },

    dayChip: {
        minWidth: 120, backgroundColor: "#ffffff",
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, gap: 4,
        shadowColor: "#4A6CF7", shadowOpacity: 0.08,
        shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    dayChipLabel: { color: "#1A1F36", fontSize: 15, fontWeight: "800", textTransform: "capitalize" },
    dayChipBadge: {
        alignSelf: "flex-start", borderRadius: 999,
        paddingHorizontal: 8, paddingVertical: 2, marginVertical: 2,
    },
    dayChipBadgeText: { fontSize: 10, fontWeight: "700" },
    dayChipCount: { color: "#8F95B2", fontSize: 12, fontWeight: "600" },

    emptyDates:    { paddingVertical: 10 },
    emptyDatesText: { color: "#8F95B2", fontSize: 14 },

    // Agenda card
    agendaCard: {
        marginHorizontal: 20, backgroundColor: "#ffffff", borderRadius: 20,
        padding: 20,
        shadowColor: "#4A6CF7", shadowOpacity: 0.09,
        shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    agendaHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 16,
    },
    agendaEyebrow: {
        color: "#8F95B2", fontSize: 10, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 0.8,
    },
    agendaTitle: { color: "#1A1F36", fontSize: 18, fontWeight: "800", textTransform: "capitalize" },
    agendaCountPill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "#E8EDFF", borderRadius: 999,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    agendaCountText: { color: "#4A6CF7", fontSize: 13, fontWeight: "800" },

    // Task card dentro de agenda
    taskCard: {
        flexDirection: "row", backgroundColor: "#F8F9FF", borderRadius: 16,
        marginBottom: 10, overflow: "hidden",
    },
    taskStripe: { width: 4 },
    taskBody:   { flex: 1, padding: 14, gap: 5 },
    taskTopRow: { flexDirection: "row", alignItems: "center" },
    taskBadge:  { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    taskBadgeText: { fontSize: 11, fontWeight: "700" },
    taskTitle:  { color: "#1A1F36", fontSize: 14, fontWeight: "800" },
    taskDesc:   { color: "#8F95B2", fontSize: 13, lineHeight: 18 },
    taskMeta:   { flexDirection: "row", gap: 8, marginTop: 2 },
    taskMetaChip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#ffffff", borderRadius: 999,
        paddingHorizontal: 8, paddingVertical: 3, flex: 1,
    },
    taskMetaText: { color: "#8F95B2", fontSize: 11, fontWeight: "600", flex: 1 },

    // Week selector
    weekCard: {
        marginHorizontal: 20, marginTop: 20, marginBottom: 16,
        backgroundColor: "#ffffff", borderRadius: 20, padding: 16,
        shadowColor: "#4A6CF7", shadowOpacity: 0.09,
        shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    weekHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 14,
    },
    weekNavBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: "#E8EDFF",
        alignItems: "center", justifyContent: "center",
    },
    weekNavBtnActive: {
        backgroundColor: "#4A6CF7",
    },
    weekMonthLabel: { color: "#2D3FE0", fontSize: 15, fontWeight: "700" },
    weekDaysRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
    weekDayCol: { flex: 1, alignItems: "center" },
    weekDaySelected: {
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4,
        alignItems: "center", width: "100%", gap: 4,
        shadowColor: "#2D3FE0", shadowOpacity: 0.25,
        shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    },
    weekDayNameSelected: {
        color: "#ffffff", fontSize: 9, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 0.4,
    },
    weekDayNumSelected: { color: "#ffffff", fontSize: 18, fontWeight: "800" },
    weekDayIdle: {
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4,
        alignItems: "center", width: "100%", gap: 4,
    },
    weekDayToday: { backgroundColor: "#E8EDFF" },
    weekDayName: {
        color: "#8F95B2", fontSize: 9, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 0.4,
    },
    weekDayNameToday: { color: "#4A6CF7" },
    weekDayNum: { color: "#1A1F36", fontSize: 18, fontWeight: "700" },
    weekDayNumToday: { color: "#2D3FE0", fontWeight: "800" },
    weekDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: "#4A6CF7" },
    weekDotToday: { backgroundColor: "#2D3FE0" },

    // Month grid
    monthDayHeaders: {
        flexDirection: "row", marginBottom: 6,
    },
    monthDayHeader: {
        flex: 1, textAlign: "center",
        color: "#8F95B2", fontSize: 9, fontWeight: "700",
        textTransform: "uppercase", letterSpacing: 0.3,
    },
    monthGrid: { flexDirection: "row", flexWrap: "wrap" },
    monthDayCol: {
        width: "14.285%", alignItems: "center", paddingVertical: 3,
    },
    monthDaySelected: {
        width: 34, height: 34, borderRadius: 11,
        alignItems: "center", justifyContent: "center", gap: 2,
        shadowColor: "#2D3FE0", shadowOpacity: 0.22,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    monthDayNumSelected: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
    monthDotSelected: {
        width: 4, height: 4, borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.75)",
    },
    monthDayIdle: {
        width: 34, height: 34, borderRadius: 11,
        alignItems: "center", justifyContent: "center", gap: 2,
    },
    monthDayTodayBg: { backgroundColor: "#E8EDFF" },
    monthDayNum: { color: "#1A1F36", fontSize: 13, fontWeight: "700" },
    monthDayNumToday: { color: "#2D3FE0", fontWeight: "800" },
    monthDot: {
        width: 4, height: 4, borderRadius: 999, backgroundColor: "#4A6CF7",
    },

    // Empty state
    emptyCard: {
        marginHorizontal: 20, marginTop: 16,
        backgroundColor: "#ffffff", borderRadius: 20,
        paddingVertical: 40, paddingHorizontal: 24,
        alignItems: "center", gap: 12,
        shadowColor: "#4A6CF7", shadowOpacity: 0.08,
        shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    emptyIconBox: {
        width: 72, height: 72, borderRadius: 22,
        alignItems: "center", justifyContent: "center",
        overflow: "hidden", marginBottom: 4,
        shadowColor: "#2D3FE0", shadowOpacity: 0.25,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    emptyIconDeco: {
        position: "absolute", top: -16, right: -16,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    emptyTitle: { color: "#1A1F36", fontSize: 16, fontWeight: "800", textAlign: "center" },
    emptyBody:  { color: "#8F95B2", fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 240 },

    // View toggle
    viewToggleRow: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16,
    },
    viewToggleWrapper: { borderRadius: 999, overflow: 'hidden' },
    viewToggleActive: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    },
    viewToggleActiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    viewToggleInactive: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 999,
        shadowColor: '#4A6CF7', shadowOpacity: 0.08,
        shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    viewToggleInactiveText: { color: '#8F95B2', fontSize: 13, fontWeight: '600' },

    // Week view
    weekViewContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
    weekViewBlock: {
        backgroundColor: '#ffffff', borderRadius: 20, padding: 16,
        shadowColor: '#4A6CF7', shadowOpacity: 0.09,
        shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    weekViewDayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    weekViewDayPillToday: {
        width: 44, height: 52, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', gap: 2,
        shadowColor: '#2D3FE0', shadowOpacity: 0.25,
        shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    },
    weekViewDayNameToday: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekViewDayNumToday: { color: '#fff', fontSize: 18, fontWeight: '800' },
    weekViewDayPillIdle: {
        width: 44, height: 52, borderRadius: 14, backgroundColor: '#F1F3FF',
        alignItems: 'center', justifyContent: 'center', gap: 2,
    },
    weekViewDayName: { color: '#8F95B2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekViewDayNum: { color: '#1A1F36', fontSize: 18, fontWeight: '700' },
    weekViewDayLabel: { color: '#8F95B2', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    weekViewCountPill: {
        backgroundColor: '#E8EDFF', borderRadius: 999,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    weekViewCountText: { color: '#4A6CF7', fontSize: 12, fontWeight: '800' },
    weekViewTasks: { gap: 8 },
    weekViewEmptyDay: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    weekViewEmptyLine: { flex: 1, height: 1, backgroundColor: '#F1F3FF' },
    weekViewEmptyText: { color: '#C7D2FE', fontSize: 12, fontWeight: '600' },
    taskTimeLabel: { color: '#8F95B2', fontSize: 11, fontWeight: '600' },
});
