import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAppContext } from "../../src/context/AppContext";

const STATUS_ORDER = {
    pending: 0,
    in_progress: 1,
    completed: 2,
    resolved: 2,
    cancelled: 3,
};

function firstRole(user) {
    if (Array.isArray(user?.roles) && user.roles[0]?.name) {
        return user.roles[0].name;
    }

    return user?.role || user?.cargo || null;
}

function getStatusTone(status) {
    if (status === "completed" || status === "resolved") {
        return {
            dot: styles.dotCompleted,
            badge: styles.badgeCompleted,
            badgeText: styles.badgeTextCompleted,
        };
    }

    if (status === "in_progress") {
        return {
            dot: styles.dotProgress,
            badge: styles.badgeProgress,
            badgeText: styles.badgeTextProgress,
        };
    }

    return {
        dot: styles.dotPending,
        badge: styles.badgePending,
        badgeText: styles.badgeTextPending,
    };
}

function getDateSource(item) {
    return item.startAt || item.dueDate || item.updatedAt || item.createdAt || null;
}

function hasScheduledDate(item) {
    return Boolean(item?.startAt || item?.dueDate);
}

function getDateKey(rawDate) {
    if (!rawDate) {
        return "Sin fecha";
    }

    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime())) {
        return "Sin fecha";
    }

    return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey) {
    if (dateKey === "Sin fecha") {
        return dateKey;
    }

    const parsed = new Date(`${dateKey}T12:00:00`);

    return new Intl.DateTimeFormat("es-EC", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(parsed);
}

function formatDateLong(dateKey) {
    if (dateKey === "Sin fecha") {
        return "Tareas sin fecha asignada";
    }

    const parsed = new Date(`${dateKey}T12:00:00`);

    return new Intl.DateTimeFormat("es-EC", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsed);
}

function getTaskStart(item) {
    const raw = item.startAt || item.dueDate || item.createdAt;

    if (!raw) {
        return null;
    }

    const parsed = new Date(raw);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    if (!item.startAt && item.dueDate) {
        parsed.setHours(6, 0, 0, 0);
    }

    return parsed;
}

function getTaskEnd(item) {
    const start = getTaskStart(item);

    if (!start) {
        return null;
    }

    if (item.endAt) {
        const parsed = new Date(item.endAt);

        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    const end = new Date(start);
    end.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
    return end;
}

function startOfWeek(date) {
    const next = new Date(date);
    const day = next.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    next.setDate(next.getDate() + diff);
    next.setHours(0, 0, 0, 0);
    return next;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function sameDay(left, right) {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function formatDayHeader(date) {
    return new Intl.DateTimeFormat("es-EC", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(date);
}

function formatTimeLabel(hour) {
    const value = String(hour).padStart(2, "0");
    const next = String(hour + 1).padStart(2, "0");
    return `${value}:00 - ${next}:00`;
}

function buildWeekDays(anchorDate) {
    const weekStart = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function getTodayReference() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function getDateRelation(dateKey, today = getTodayReference()) {
    if (dateKey === "Sin fecha") {
        return "undated";
    }

    const parsed = new Date(`${dateKey}T12:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return "undated";
    }

    parsed.setHours(0, 0, 0, 0);

    if (parsed.getTime() < today.getTime()) {
        return "past";
    }

    if (parsed.getTime() === today.getTime()) {
        return "today";
    }

    return "upcoming";
}

function getSectionBadgeLabel(dateKey, today = getTodayReference()) {
    const relation = getDateRelation(dateKey, today);

    if (relation === "today") {
        return "Hoy";
    }

    if (relation === "upcoming") {
        return "Proxima";
    }

    if (relation === "past") {
        return "Pasada";
    }

    return "Sin fecha";
}

function compareSectionKeys(left, right, today = getTodayReference()) {
    const leftRelation = getDateRelation(left, today);
    const rightRelation = getDateRelation(right, today);
    const relationOrder = {
        today: 0,
        upcoming: 1,
        past: 2,
        undated: 3,
    };
    const relationDiff = relationOrder[leftRelation] - relationOrder[rightRelation];

    if (relationDiff !== 0) {
        return relationDiff;
    }

    if (leftRelation === "upcoming") {
        return left.localeCompare(right);
    }

    if (leftRelation === "past") {
        return right.localeCompare(left);
    }

    return left.localeCompare(right);
}

function pickInitialDateKey(sections, today = getTodayReference()) {
    const todayKey = today.toISOString().slice(0, 10);

    if (sections.some((section) => section.dateKey === todayKey)) {
        return todayKey;
    }

    const nextCurrent = sections.find((section) => getDateRelation(section.dateKey, today) === "upcoming");

    if (nextCurrent) {
        return nextCurrent.dateKey;
    }

    const latestPast = sections.find((section) => getDateRelation(section.dateKey, today) === "past");

    if (latestPast) {
        return latestPast.dateKey;
    }

    return sections[0]?.dateKey ?? null;
}

function taskBelongsToSlot(task, dayDate, hour) {
    const start = getTaskStart(task);

    if (!start || !sameDay(start, dayDate)) {
        return false;
    }

    if (task.allDay) {
        return hour === 6;
    }

    const end = getTaskEnd(task) || start;
    const slotStart = new Date(dayDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(dayDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return start < slotEnd && end > slotStart;
}

function isTaskForCurrentUser(item, user) {
    if (!user) {
        return false;
    }

    const fullName = [user.name, user.lastname].filter(Boolean).join(" ").trim().toUpperCase();
    const assignedName = (item.assignedCleanerName || "").trim().toUpperCase();

    return (
        String(item.userId || "") === String(user.id || "") ||
        (fullName && assignedName && fullName === assignedName)
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildScheduleHtml(items, user, selectedDate) {
    const anchorDate = selectedDate && selectedDate !== "Sin fecha"
        ? new Date(`${selectedDate}T12:00:00`)
        : getTodayReference();
    const weekDays = buildWeekDays(anchorDate);
    const hourSlots = Array.from({ length: 14 }, (_, index) => 6 + index);
    const headerCells = weekDays
        .map((date) => `<th>${escapeHtml(formatDayHeader(date))}</th>`)
        .join("");
    const bodyRows = hourSlots
        .map((hour) => {
            const dayCells = weekDays
                .map((dayDate) => {
                    const slotTasks = items.filter((task) => taskBelongsToSlot(task, dayDate, hour));
                    const content = slotTasks.length
                        ? slotTasks.map((task) => `
                            <div class="task-card ${task.allDay ? "all-day" : ""}">
                                <div class="task-title">${escapeHtml(task.title || "Tarea sin titulo")}</div>
                            </div>
                        `).join("")
                        : `<div class="empty-slot"></div>`;

                    return `<td>${content}</td>`;
                })
                .join("");

            return `
                <tr>
                    <th class="hour-cell">${escapeHtml(formatTimeLabel(hour))}</th>
                    ${dayCells}
                </tr>
            `;
        })
        .join("");

    return `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        color: #16211e;
                        padding: 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse; 
                        table-layout: fixed;
                    }
                    th {
                        background: #e7f0ec;
                        color: #10342d;
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.4px;
                    }
                    th, td {
                        border: 1px solid #d9e5e0;
                        padding: 4px;
                        text-align: left;
                        vertical-align: top;
                        font-size: 10px;
                    }
                    .hour-cell {
                        width: 72px;
                        background: #f3f7f5;
                        font-weight: bold;
                    }
                    td {
                        height: 48px;
                        background: #ffffff;
                    }
                    .task-card {
                        background: #eaf3f0;
                        border-left: 3px solid #10342d;
                        border-radius: 6px;
                        padding: 4px 5px;
                        margin-bottom: 3px;
                        overflow: hidden;
                    }
                    .task-card.all-day {
                        background: #f5ebd8;
                        border-left-color: #936b20;
                    }
                    .task-title {
                        font-size: 9px;
                        font-weight: bold;
                        color: #16211e;
                        line-height: 1.15;
                    }
                    .empty-slot {
                        min-height: 38px;
                    }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th class="hour-cell">Hora</th>
                            ${headerCells}
                        </tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </body>
        </html>
    `;
}

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const router = useRouter();
    const { user, tasks, tasksLoaded, refreshTasks } = useAppContext();
    const role = firstRole(user);
    const isConcierge = role === "conserje";

    useEffect(() => {
        if (!tasksLoaded) {
            refreshTasks().catch((error) => {
                Alert.alert("Error al cargar calendario", error?.message || "No se pudieron cargar las tareas.");
            });
        }
    }, [tasksLoaded, refreshTasks]);

    const visibleItems = useMemo(() => {
        const source = isConcierge
            ? tasks.filter((item) => isTaskForCurrentUser(item, user))
            : tasks;

        return source
            .filter((item) => hasScheduledDate(item))
            .sort((a, b) => {
            const dateDiff = new Date(getDateSource(a) || 0).getTime() - new Date(getDateSource(b) || 0).getTime();

            if (dateDiff !== 0) {
                return dateDiff;
            }

            return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        });
    }, [tasks, isConcierge, user]);

    const todayReference = useMemo(() => getTodayReference(), []);

    const sections = useMemo(() => {
        const grouped = visibleItems.reduce((accumulator, item) => {
            const dateKey = getDateKey(getDateSource(item));

            if (!accumulator[dateKey]) {
                accumulator[dateKey] = [];
            }

            accumulator[dateKey].push(item);
            return accumulator;
        }, {});

        return Object.entries(grouped)
            .sort(([left], [right]) => compareSectionKeys(left, right, todayReference))
            .map(([dateKey, items]) => ({
                dateKey,
                label: formatDateLabel(dateKey),
                longLabel: formatDateLong(dateKey),
                badgeLabel: getSectionBadgeLabel(dateKey, todayReference),
                items,
            }));
    }, [visibleItems, todayReference]);

    useEffect(() => {
        if (!sections.length) {
            setSelectedDate(null);
            return;
        }

        if (!selectedDate || !sections.some((section) => section.dateKey === selectedDate)) {
            setSelectedDate(pickInitialDateKey(sections, todayReference));
        }
    }, [sections, selectedDate, todayReference]);

    const activeSection = useMemo(() => {
        return sections.find((section) => section.dateKey === selectedDate) || sections[0] || null;
    }, [sections, selectedDate]);

    const pendingCount = visibleItems.filter((item) => item.status === "pending").length;
    const inProgressCount = visibleItems.filter((item) => item.status === "in_progress").length;

    const exportSchedule = async () => {
        if (!visibleItems.length) {
            Alert.alert("Sin tareas", "No hay tareas programadas para exportar en el horario.");
            return;
        }

        const safeName = [user?.name, user?.lastname]
            .filter(Boolean)
            .join("-")
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "conserje";
        const dateStamp = new Date().toISOString().slice(0, 10);
        const fileName = `horario-${safeName}-${dateStamp}.pdf`;
        const htmlContent = buildScheduleHtml(visibleItems, user, selectedDate);

        setIsExporting(true);

        try {
            if (Platform.OS === "web") {
                await Print.printAsync({
                    html: htmlContent,
                });
                return;
            }

            const pdf = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            if (Platform.OS === "android") {
                const canShare = await Sharing.isAvailableAsync();

                if (!canShare) {
                    Alert.alert("No disponible", "Este dispositivo no permite compartir archivos PDF desde la app.");
                    return;
                }

                await Sharing.shareAsync(pdf.uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Guardar horario en PDF",
                    UTI: "com.adobe.pdf",
                });
                return;
            }

            const canShare = await Sharing.isAvailableAsync();

            if (!canShare) {
                Alert.alert("No disponible", "No se pudo abrir la opcion para compartir el PDF.");
                return;
            }

            await Sharing.shareAsync(pdf.uri, {
                mimeType: "application/pdf",
                dialogTitle: `Horario exportado: ${fileName}`,
                UTI: "com.adobe.pdf",
            });
        } catch (error) {
            Alert.alert("No se pudo descargar", error?.message || "Ocurrio un error al generar el horario.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Agenda operativa</Text>
                <Text style={styles.title}>Calendario de tareas</Text>
                <Text style={styles.subtitle}>
                    {isConcierge
                        ? "Consulta solo tus tareas programadas por fecha y descarga tu horario semanal."
                        : "Consulta la agenda programada por fecha y revisa las tareas asignadas a cada conserje."}
                </Text>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryMetric}>
                    <Text style={styles.summaryValue}>{visibleItems.length}</Text>
                    <Text style={styles.summaryLabel}>Programadas</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryMetric}>
                    <Text style={styles.summaryValue}>{pendingCount}</Text>
                    <Text style={styles.summaryLabel}>Pendientes</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryMetric}>
                    <Text style={styles.summaryValue}>{inProgressCount}</Text>
                    <Text style={styles.summaryLabel}>En progreso</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={exportSchedule} disabled={isExporting}>
                <MaterialCommunityIcons name="download-outline" size={18} color="#f4f7f5" />
                <Text style={styles.exportButtonText}>
                    {isExporting
                        ? "Generando archivo..."
                        : isConcierge
                            ? "Descargar mi horario"
                            : "Descargar agenda"}
                </Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fechas</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daySelectorContent}
                style={styles.daySelector}
            >
                {sections.length ? (
                    sections.map((section) => {
                        const active = section.dateKey === activeSection?.dateKey;

                        return (
                            <TouchableOpacity
                                key={section.dateKey}
                                style={[styles.dayChip, active && styles.dayChipActive]}
                                onPress={() => setSelectedDate(section.dateKey)}
                            >
                                <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>
                                    {section.label}
                                </Text>
                                <Text style={[styles.dayChipBadge, active && styles.dayChipBadgeActive]}>
                                    {section.badgeLabel}
                                </Text>
                                <Text style={[styles.dayChipCount, active && styles.dayChipCountActive]}>
                                    {section.items.length} tarea{section.items.length === 1 ? "" : "s"}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyDateState}>
                        <Text style={styles.emptyDateText}>No hay tareas programadas con fecha todavia.</Text>
                    </View>
                )}
            </ScrollView>

            {activeSection ? (
                <View style={styles.agendaCard}>
                    <View style={styles.agendaHeader}>
                        <View>
                            <Text style={styles.agendaEyebrow}>Fecha seleccionada</Text>
                            <Text style={styles.agendaTitle}>{activeSection.longLabel}</Text>
                        </View>
                        <View style={styles.agendaPill}>
                            <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#10342d" />
                            <Text style={styles.agendaPillText}>{activeSection.items.length}</Text>
                        </View>
                    </View>

                    {activeSection.items.map((item) => {
                        const tone = getStatusTone(item.status);

                        return (
                            <TouchableOpacity
                                key={String(item.id)}
                                style={styles.taskCard}
                                onPress={() =>
                                    router.push({
                                        pathname: "/IncidentDetail",
                                        params: { id: String(item.id), type: 'task' },
                                    })
                                }
                            >
                                <View style={styles.taskHeader}>
                                    <View style={styles.taskTitleRow}>
                                        <View style={[styles.statusDot, tone.dot]} />
                                        <Text style={styles.taskTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                    </View>

                                    <View style={[styles.statusBadge, tone.badge]}>
                                        <Text style={[styles.statusBadgeText, tone.badgeText]}>{item.statusLabel}</Text>
                                    </View>
                                </View>

                                <Text style={styles.taskDescription} numberOfLines={2}>
                                    {item.description || "Sin descripcion registrada."}
                                </Text>

                                <View style={styles.taskMetaRow}>
                                    <View style={styles.metaPill}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#45635b" />
                                        <Text style={styles.metaPillText}>{item.location || "Sin ubicacion"}</Text>
                                    </View>
                                    <View style={styles.metaPill}>
                                        <MaterialCommunityIcons name="account-outline" size={14} color="#45635b" />
                                        <Text style={styles.metaPillText}>{item.assignedCleanerName || "Sin asignar"}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Sin tareas programadas</Text>
                    <Text style={styles.emptyText}>
                        Aqui solo aparecen tareas que tienen fecha asignada para que el calendario no duplique la bandeja de incidencias.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f6f4",
    },
    content: {
        padding: 20,
        paddingBottom: 34,
    },
    header: {
        marginTop: 54,
        marginBottom: 18,
    },
    eyebrow: {
        color: "#6b7d78",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.1,
        marginBottom: 8,
    },
    title: {
        color: "#16211e",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        color: "#64746f",
        fontSize: 15,
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: "#10342d",
        borderRadius: 26,
        paddingHorizontal: 18,
        paddingVertical: 20,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 22,
    },
    summaryMetric: {
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 44,
        backgroundColor: "rgba(255,255,255,0.14)",
        marginHorizontal: 12,
    },
    summaryValue: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 4,
    },
    summaryLabel: {
        color: "#c8ddd6",
        fontSize: 12,
        fontWeight: "700",
    },
    exportButton: {
        backgroundColor: "#10342d",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    exportButtonText: {
        color: "#f4f7f5",
        fontSize: 14,
        fontWeight: "800",
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: "#16211e",
        fontSize: 19,
        fontWeight: "800",
    },
    daySelector: {
        marginBottom: 18,
    },
    daySelectorContent: {
        paddingRight: 8,
        gap: 10,
    },
    dayChip: {
        minWidth: 118,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#d9e5e0",
    },
    dayChipActive: {
        backgroundColor: "#dfeee7",
        borderColor: "#8fb6a7",
    },
    dayChipLabel: {
        color: "#17342d",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
        textTransform: "capitalize",
    },
    dayChipLabelActive: {
        color: "#10342d",
    },
    dayChipBadge: {
        color: "#6b7d78",
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    dayChipBadgeActive: {
        color: "#355f53",
    },
    dayChipCount: {
        color: "#687974",
        fontSize: 12,
        fontWeight: "700",
    },
    dayChipCountActive: {
        color: "#355f53",
    },
    emptyDateState: {
        paddingVertical: 10,
    },
    emptyDateText: {
        color: "#687974",
        fontSize: 14,
    },
    agendaCard: {
        backgroundColor: "#ffffff",
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: "#d9e5e0",
    },
    agendaHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
    },
    agendaEyebrow: {
        color: "#6b7d78",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    agendaTitle: {
        color: "#16211e",
        fontSize: 22,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    agendaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#edf4f1",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    agendaPillText: {
        color: "#10342d",
        fontSize: 13,
        fontWeight: "800",
    },
    taskCard: {
        backgroundColor: "#f8faf9",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "#d9e5e0",
        marginBottom: 12,
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 10,
    },
    taskTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    dotPending: {
        backgroundColor: "#c48a21",
    },
    dotProgress: {
        backgroundColor: "#1676a1",
    },
    dotCompleted: {
        backgroundColor: "#1f9b66",
    },
    taskTitle: {
        flex: 1,
        color: "#16211e",
        fontSize: 16,
        fontWeight: "800",
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "800",
    },
    badgePending: {
        backgroundColor: "#f5ebd8",
    },
    badgeTextPending: {
        color: "#936b20",
    },
    badgeProgress: {
        backgroundColor: "#e3eff6",
    },
    badgeTextProgress: {
        color: "#14688f",
    },
    badgeCompleted: {
        backgroundColor: "#e5f4ec",
    },
    badgeTextCompleted: {
        color: "#1b8659",
    },
    taskDescription: {
        color: "#64746f",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 14,
    },
    taskMetaRow: {
        gap: 10,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#e2ebe7",
        marginBottom: 8,
    },
    metaPillText: {
        flex: 1,
        color: "#45635b",
        fontSize: 13,
        fontWeight: "700",
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "#d9e5e0",
        marginTop: 8,
    },
    emptyTitle: {
        color: "#16211e",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 6,
    },
    emptyText: {
        color: "#687974",
        fontSize: 14,
        lineHeight: 21,
    },
});
