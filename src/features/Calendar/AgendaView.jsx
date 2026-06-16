import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDateLong, getStatusConfig, ecDayName, ecDayNum } from './helpers';

function TaskCard({ item, showTime }) {
    const router = useRouter();
    const sc = getStatusConfig(item.status);
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={s.taskCard}
            onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'task' } })}
        >
            <View style={[s.taskStripe, { backgroundColor: sc.stripe }]} />
            <View style={s.taskBody}>
                <View style={[s.taskTopRow, showTime && { justifyContent: 'space-between' }]}>
                    <View style={[s.taskBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[s.taskBadgeText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                    {showTime && item.startAt && !item.allDay && (
                        <Text style={s.taskTimeLabel}>
                            {new Date(item.startAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </View>
                <Text style={s.taskTitle} numberOfLines={1}>{item.title}</Text>
                {!showTime && (
                    <Text style={s.taskDesc} numberOfLines={2}>{item.description || 'Sin descripción registrada.'}</Text>
                )}
                <View style={s.taskMeta}>
                    <View style={s.taskMetaChip}>
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#8F95B2" />
                        <Text style={s.taskMetaText} numberOfLines={1}>{item.location || 'Sin ubicación'}</Text>
                    </View>
                    {!showTime && (
                        <View style={s.taskMetaChip}>
                            <MaterialCommunityIcons name="account-outline" size={12} color="#8F95B2" />
                            <Text style={s.taskMetaText} numberOfLines={1}>{item.assignedCleanerName || 'Sin asignar'}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export function DayView({ activeSection, selectedDate }) {
    if (!activeSection) {
        return (
            <View style={s.emptyCard}>
                <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.emptyIconBox}
                >
                    <View style={s.emptyIconDeco} />
                    <MaterialCommunityIcons name="calendar-blank-outline" size={30} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
                <Text style={s.emptyTitle}>{selectedDate ? 'Sin tareas este día' : 'Sin tareas programadas'}</Text>
                <Text style={s.emptyBody}>
                    {selectedDate && selectedDate !== 'Sin fecha'
                        ? formatDateLong(selectedDate)
                        : 'Solo aparecen tareas que tienen fecha asignada.'}
                </Text>
            </View>
        );
    }
    return (
        <View style={s.agendaCard}>
            <View style={s.agendaHeader}>
                <View style={{ gap: 3 }}>
                    <Text style={s.agendaEyebrow}>FECHA SELECCIONADA</Text>
                    <Text style={s.agendaTitle}>{activeSection.longLabel}</Text>
                </View>
                <View style={s.agendaCountPill}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#4A6CF7" />
                    <Text style={s.agendaCountText}>{activeSection.items.length}</Text>
                </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#F1F3FF', marginBottom: 12 }} />
            {activeSection.items.map((item) => (
                <TaskCard key={String(item.id)} item={item} showTime={false} />
            ))}
        </View>
    );
}

export function WeekView({ weekDays, sections, todayKey }) {
    return (
        <View style={s.weekViewContainer}>
            {weekDays.map((dayKey) => {
                const daySection = sections.find((s) => s.dateKey === dayKey);
                const isToday    = dayKey === todayKey;
                const hasTasks   = Boolean(daySection?.items?.length);
                return (
                    <View key={dayKey} style={s.weekViewBlock}>
                        <View style={s.weekViewDayHeader}>
                            {isToday ? (
                                <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.weekViewDayPillToday}>
                                    <Text style={s.weekViewDayNameToday}>{ecDayName(dayKey)}</Text>
                                    <Text style={s.weekViewDayNumToday}>{ecDayNum(dayKey)}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={s.weekViewDayPillIdle}>
                                    <Text style={s.weekViewDayName}>{ecDayName(dayKey)}</Text>
                                    <Text style={s.weekViewDayNum}>{ecDayNum(dayKey)}</Text>
                                </View>
                            )}
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={s.weekViewDayLabel} numberOfLines={1}>{formatDateLong(dayKey)}</Text>
                            </View>
                            {hasTasks && (
                                <View style={s.weekViewCountPill}>
                                    <Text style={s.weekViewCountText}>{daySection.items.length}</Text>
                                </View>
                            )}
                        </View>
                        {hasTasks ? (
                            <View style={s.weekViewTasks}>
                                {daySection.items.map((item) => (
                                    <TaskCard key={String(item.id)} item={item} showTime={true} />
                                ))}
                            </View>
                        ) : (
                            <View style={s.weekViewEmptyDay}>
                                <View style={s.weekViewEmptyLine} />
                                <Text style={s.weekViewEmptyText}>Sin tareas</Text>
                                <View style={s.weekViewEmptyLine} />
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const s = StyleSheet.create({
    // Shared task card
    taskCard:         { flexDirection: 'row', backgroundColor: '#F8F9FF', borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
    taskStripe:       { width: 4 },
    taskBody:         { flex: 1, padding: 14, gap: 5 },
    taskTopRow:       { flexDirection: 'row', alignItems: 'center' },
    taskBadge:        { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    taskBadgeText:    { fontSize: 11, fontWeight: '700' },
    taskTitle:        { color: '#1A1F36', fontSize: 14, fontWeight: '800' },
    taskDesc:         { color: '#8F95B2', fontSize: 13, lineHeight: 18 },
    taskMeta:         { flexDirection: 'row', gap: 8, marginTop: 2 },
    taskMetaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, flex: 1 },
    taskMetaText:     { color: '#8F95B2', fontSize: 11, fontWeight: '600', flex: 1 },
    taskTimeLabel:    { color: '#8F95B2', fontSize: 11, fontWeight: '600' },
    // Agenda (day) view
    agendaCard:       { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    agendaHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    agendaEyebrow:    { color: '#8F95B2', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    agendaTitle:      { color: '#1A1F36', fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
    agendaCountPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    agendaCountText:  { color: '#4A6CF7', fontSize: 13, fontWeight: '800' },
    // Empty state
    emptyCard:        { marginHorizontal: 20, marginTop: 16, backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', gap: 12, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    emptyIconBox:     { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    emptyIconDeco:    { position: 'absolute', top: -16, right: -16, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)' },
    emptyTitle:       { color: '#1A1F36', fontSize: 16, fontWeight: '800', textAlign: 'center' },
    emptyBody:        { color: '#8F95B2', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 240 },
    // Week view
    weekViewContainer:{ paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
    weekViewBlock:    { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    weekViewDayHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    weekViewDayPillToday:{ width: 44, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    weekViewDayNameToday:{ color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekViewDayNumToday: { color: '#fff', fontSize: 18, fontWeight: '800' },
    weekViewDayPillIdle: { width: 44, height: 52, borderRadius: 14, backgroundColor: '#F1F3FF', alignItems: 'center', justifyContent: 'center', gap: 2 },
    weekViewDayName:  { color: '#8F95B2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekViewDayNum:   { color: '#1A1F36', fontSize: 18, fontWeight: '700' },
    weekViewDayLabel: { color: '#8F95B2', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    weekViewCountPill:{ backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    weekViewCountText:{ color: '#4A6CF7', fontSize: 12, fontWeight: '800' },
    weekViewTasks:    { gap: 8 },
    weekViewEmptyDay: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    weekViewEmptyLine:{ flex: 1, height: 1, backgroundColor: '#F1F3FF' },
    weekViewEmptyText:{ color: '#C7D2FE', fontSize: 12, fontWeight: '600' },
});
