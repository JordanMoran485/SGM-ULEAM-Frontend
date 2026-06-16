import React from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCalendar } from '../../src/features/Calendar/useCalendar';
import { CalendarHero } from '../../src/features/Calendar/CalendarHero';
import { CalendarSkeletonScreen } from '../../src/features/Calendar/CalendarSkeletonScreen';
import { DateSelector } from '../../src/features/Calendar/DateSelector';
import { DayView, WeekView } from '../../src/features/Calendar/AgendaView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen() {
    const {
        isConcierge, tasksLoaded,
        selectedDate, setSelectedDate,
        weekAnchor, setWeekAnchor,
        isMonthExpanded, toggleMonthView,
        viewMode, setViewMode,
        isExporting, exportSchedule,
        visibleItems, sections, activeSection,
        todayKey, weekDays,
        pendingCount, inProgressCount,
        contentOpacity,
        navPrev, navNext,
    } = useCalendar();

    if (!tasksLoaded) return <CalendarSkeletonScreen />;

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <CalendarHero
                visibleItems={visibleItems}
                pendingCount={pendingCount}
                inProgressCount={inProgressCount}
                isConcierge={isConcierge}
                isExporting={isExporting}
                onExport={exportSchedule}
            />

            <DateSelector
                weekAnchor={weekAnchor}
                weekDays={weekDays}
                isMonthExpanded={isMonthExpanded}
                toggleMonthView={toggleMonthView}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                todayKey={todayKey}
                sections={sections}
                navPrev={navPrev}
                navNext={navNext}
            />

            {/* View toggle */}
            <View style={s.viewToggleRow}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewMode('day')} style={s.viewToggleWrapper}>
                    {viewMode === 'day' ? (
                        <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.viewToggleActive}>
                            <MaterialCommunityIcons name="calendar-today" size={14} color="#fff" />
                            <Text style={s.viewToggleActiveText}>Día</Text>
                        </LinearGradient>
                    ) : (
                        <View style={s.viewToggleInactive}>
                            <MaterialCommunityIcons name="calendar-today" size={14} color="#8F95B2" />
                            <Text style={s.viewToggleInactiveText}>Día</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewMode('week')} style={s.viewToggleWrapper}>
                    {viewMode === 'week' ? (
                        <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.viewToggleActive}>
                            <MaterialCommunityIcons name="view-week-outline" size={14} color="#fff" />
                            <Text style={s.viewToggleActiveText}>Semana</Text>
                        </LinearGradient>
                    ) : (
                        <View style={s.viewToggleInactive}>
                            <MaterialCommunityIcons name="view-week-outline" size={14} color="#8F95B2" />
                            <Text style={s.viewToggleInactiveText}>Semana</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: contentOpacity }}>
                {viewMode === 'week' ? (
                    <WeekView weekDays={weekDays} sections={sections} todayKey={todayKey} />
                ) : (
                    <DayView activeSection={activeSection} selectedDate={selectedDate} />
                )}
            </Animated.View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container:           { flex: 1, backgroundColor: '#EEF2FF' },
    content:             { paddingBottom: 48 },
    viewToggleRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
    viewToggleWrapper:   { borderRadius: 999, overflow: 'hidden' },
    viewToggleActive:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
    viewToggleActiveText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
    viewToggleInactive:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    viewToggleInactiveText: { color: '#8F95B2', fontSize: 13, fontWeight: '600' },
});
