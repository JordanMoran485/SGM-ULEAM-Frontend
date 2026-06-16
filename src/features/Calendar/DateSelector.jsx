import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DAY_HEADERS, buildEcMonthGrid, ecDayName, ecDayNum, ecMonthNum, ecMonthYearLabel } from './helpers';

export function DateSelector({ weekAnchor, weekDays, isMonthExpanded, toggleMonthView, selectedDate, onSelectDate, todayKey, sections, navPrev, navNext }) {
    return (
        <View style={s.weekCard}>
            <View style={s.weekHeader}>
                <TouchableOpacity activeOpacity={0.85} style={s.weekNavBtn} onPress={navPrev}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#4A6CF7" />
                </TouchableOpacity>

                <Text style={s.weekMonthLabel}>{ecMonthYearLabel(weekAnchor)}</Text>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity activeOpacity={0.85} style={[s.weekNavBtn, isMonthExpanded && s.weekNavBtnActive]} onPress={toggleMonthView}>
                        <MaterialCommunityIcons
                            name={isMonthExpanded ? 'calendar-week' : 'calendar-month-outline'}
                            size={22}
                            color={isMonthExpanded ? '#ffffff' : '#4A6CF7'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} style={s.weekNavBtn} onPress={navNext}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#4A6CF7" />
                    </TouchableOpacity>
                </View>
            </View>

            {isMonthExpanded ? (
                <>
                    <View style={s.monthDayHeaders}>
                        {DAY_HEADERS.map((h) => (
                            <Text key={h} style={s.monthDayHeader}>{h}</Text>
                        ))}
                    </View>
                    <View style={s.monthGrid}>
                        {buildEcMonthGrid(weekAnchor).days.map((key, i) => {
                            const isCurrentMonth = ecMonthNum(key) === ecMonthNum(weekAnchor);
                            const isSelected = key === selectedDate;
                            const isToday    = key === todayKey;
                            const hasTasks   = sections.some((s) => s.dateKey === key);
                            return (
                                <TouchableOpacity key={key + i} activeOpacity={0.85} style={s.monthDayCol} onPress={() => onSelectDate(key)}>
                                    {isSelected ? (
                                        <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.monthDaySelected}>
                                            <Text style={s.monthDayNumSelected}>{ecDayNum(key)}</Text>
                                            {hasTasks && isCurrentMonth && <View style={s.monthDotSelected} />}
                                        </LinearGradient>
                                    ) : (
                                        <View style={[s.monthDayIdle, isToday && s.monthDayTodayBg, !isCurrentMonth && { opacity: 0.28 }]}>
                                            <Text style={[s.monthDayNum, isToday && s.monthDayNumToday]}>{ecDayNum(key)}</Text>
                                            {hasTasks && isCurrentMonth && <View style={[s.monthDot, isToday && s.weekDotToday]} />}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </>
            ) : (
                <View style={s.weekDaysRow}>
                    {weekDays.map((key) => {
                        const isSelected = key === selectedDate;
                        const isToday    = key === todayKey;
                        const hasTasks   = sections.some((s) => s.dateKey === key);
                        return (
                            <TouchableOpacity key={key} activeOpacity={0.85} style={s.weekDayCol} onPress={() => onSelectDate(key)}>
                                {isSelected ? (
                                    <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.weekDaySelected}>
                                        <Text style={s.weekDayNameSelected}>{ecDayName(key)}</Text>
                                        <Text style={s.weekDayNumSelected}>{ecDayNum(key)}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={[s.weekDayIdle, isToday && s.weekDayToday]}>
                                        <Text style={[s.weekDayName, isToday && s.weekDayNameToday]}>{ecDayName(key)}</Text>
                                        <Text style={[s.weekDayNum, isToday && s.weekDayNumToday]}>{ecDayNum(key)}</Text>
                                        {hasTasks && <View style={[s.weekDot, isToday && s.weekDotToday]} />}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    weekCard:           { marginHorizontal: 20, marginTop: 20, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    weekHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    weekNavBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8EDFF', alignItems: 'center', justifyContent: 'center' },
    weekNavBtnActive:   { backgroundColor: '#4A6CF7' },
    weekMonthLabel:     { color: '#2D3FE0', fontSize: 15, fontWeight: '700' },
    weekDaysRow:        { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    weekDayCol:         { flex: 1, alignItems: 'center' },
    weekDaySelected:    { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', width: '100%', gap: 4, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    weekDayNameSelected:{ color: '#ffffff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekDayNumSelected: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
    weekDayIdle:        { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', width: '100%', gap: 4 },
    weekDayToday:       { backgroundColor: '#E8EDFF' },
    weekDayName:        { color: '#8F95B2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    weekDayNameToday:   { color: '#4A6CF7' },
    weekDayNum:         { color: '#1A1F36', fontSize: 18, fontWeight: '700' },
    weekDayNumToday:    { color: '#2D3FE0', fontWeight: '800' },
    weekDot:            { width: 5, height: 5, borderRadius: 999, backgroundColor: '#4A6CF7' },
    weekDotToday:       { backgroundColor: '#2D3FE0' },
    monthDayHeaders:    { flexDirection: 'row', marginBottom: 6 },
    monthDayHeader:     { flex: 1, textAlign: 'center', color: '#8F95B2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    monthGrid:          { flexDirection: 'row', flexWrap: 'wrap' },
    monthDayCol:        { width: '14.285%', alignItems: 'center', paddingVertical: 3 },
    monthDaySelected:   { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', gap: 2, shadowColor: '#2D3FE0', shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    monthDayNumSelected:{ color: '#ffffff', fontSize: 13, fontWeight: '800' },
    monthDotSelected:   { width: 4, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.75)' },
    monthDayIdle:       { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', gap: 2 },
    monthDayTodayBg:    { backgroundColor: '#E8EDFF' },
    monthDayNum:        { color: '#1A1F36', fontSize: 13, fontWeight: '700' },
    monthDayNumToday:   { color: '#2D3FE0', fontWeight: '800' },
    monthDot:           { width: 4, height: 4, borderRadius: 999, backgroundColor: '#4A6CF7' },
});
