import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CARD_W, CHART_H, DOT_D, DOT_R, USABLE_W } from './helpers';

function WeekLineChart({ data, max, todayIndex }) {
    const pts = data.map((d, i) => ({
        cx: DOT_R + (i / (data.length - 1)) * (USABLE_W - DOT_D),
        cy: CHART_H - (d.count > 0 ? Math.max((d.count / max) * (CHART_H - DOT_D), DOT_R * 2) : DOT_R),
        count: d.count,
        label: d.label,
    }));

    return (
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            <View style={{ height: CHART_H + 28 }}>
                {pts.slice(0, -1).map((pt, i) => {
                    const nx  = pts[i + 1].cx;
                    const ny  = pts[i + 1].cy;
                    const dx  = nx - pt.cx;
                    const dy  = ny - pt.cy;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
                    return (
                        <View key={i} style={{
                            position: 'absolute',
                            width: len, height: 2, backgroundColor: '#C7D2FE', borderRadius: 1,
                            left: (pt.cx + nx) / 2 - len / 2,
                            top:  (pt.cy + ny) / 2 - 1,
                            transform: [{ rotate: `${ang}deg` }],
                        }} />
                    );
                })}
                {pts.map((pt, i) => pt.count === 0 ? null : (
                    <Text key={`c${i}`} style={{
                        position: 'absolute', left: pt.cx - 10, top: pt.cy - DOT_R - 15,
                        width: 20, textAlign: 'center',
                        color: i === todayIndex ? '#2D3FE0' : '#4A6CF7',
                        fontSize: 10, fontWeight: '800',
                    }}>{pt.count}</Text>
                ))}
                {pts.map((pt, i) => {
                    const isToday = i === todayIndex;
                    return (
                        <View key={`d${i}`} style={{
                            position: 'absolute', left: pt.cx - DOT_R, top: pt.cy - DOT_R,
                            width: DOT_D, height: DOT_D, borderRadius: DOT_R,
                            backgroundColor: isToday ? '#2D3FE0' : '#7B9FFF',
                            borderWidth: 2, borderColor: '#ffffff',
                            shadowColor: '#2D3FE0', shadowOpacity: isToday ? 0.35 : 0,
                            shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
                            elevation: isToday ? 4 : 0, zIndex: 2,
                        }} />
                    );
                })}
                {pts.map((pt, i) => {
                    const isToday = i === todayIndex;
                    return (
                        <Text key={`l${i}`} style={{
                            position: 'absolute', left: pt.cx - 10, top: CHART_H + 8,
                            width: 20, textAlign: 'center',
                            color: isToday ? '#2D3FE0' : '#8F95B2',
                            fontSize: 10, fontWeight: isToday ? '800' : '700',
                        }}>{data[i].label}</Text>
                    );
                })}
            </View>
        </View>
    );
}

export function ChartCarousel({
    weeklyData, incWeeklyData, chartMax, incChartMax, todayIndex,
    barProgress, taskChartType, setTaskChartType, chartSlide, setChartSlide,
    weekTotal, incWeekTotal,
}) {
    return (
        <>
            <ScrollView
                horizontal
                pagingEnabled={false}
                snapToInterval={CARD_W + 12}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={c.carouselContent}
                onScroll={(e) => setChartSlide(e.nativeEvent.contentOffset.x > CARD_W / 2 ? 1 : 0)}
                scrollEventThrottle={16}
            >
                {/* Tareas solucionadas */}
                <View style={[c.chartCard, { width: CARD_W }]}>
                    <View style={c.chartHeader}>
                        <View>
                            <Text style={c.chartEyebrow}>Tareas Solucionadas</Text>
                            <View style={c.chartNumRow}>
                                <Text style={c.chartBigNum}>{weekTotal}</Text>
                                <Text style={c.chartWeekLabel}>esta semana</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => setTaskChartType(t => t === 'bar' ? 'line' : 'bar')}
                            style={[c.chartIconBox, taskChartType === 'line' && c.chartIconBoxActive]}
                        >
                            <MaterialCommunityIcons
                                name={taskChartType === 'bar' ? 'chart-bell-curve' : 'chart-bar'}
                                size={24}
                                color={taskChartType === 'line' ? '#ffffff' : '#2D3FE0'}
                            />
                        </TouchableOpacity>
                    </View>
                    {taskChartType === 'bar' ? (
                        <View style={c.chartBars}>
                            {weeklyData.map((day, index) => {
                                const isToday = index === todayIndex;
                                const barH = day.count > 0 ? Math.max((day.count / chartMax) * CHART_H, 8) : 4;
                                return (
                                    <View key={day.label} style={c.chartBarCol}>
                                        <View style={c.chartTodayLabelBox}>
                                            {isToday && <Text style={c.chartTodayLabel}>{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][index]}</Text>}
                                        </View>
                                        <View style={c.chartTrack}>
                                            <Animated.View style={[
                                                c.chartBar,
                                                { height: barH, transform: [
                                                    { translateY: barProgress.interpolate({ inputRange: [0, 1], outputRange: [barH / 2, 0] }) },
                                                    { scaleY: barProgress },
                                                ]},
                                                isToday ? c.chartBarToday : c.chartBarIdle,
                                            ]}>
                                                {day.count > 0 && barH >= 24 && (
                                                    <Text style={[c.chartBarCount, { color: isToday ? '#ffffff' : '#4A6CF7' }]}>{day.count}</Text>
                                                )}
                                            </Animated.View>
                                        </View>
                                        <Text style={[c.chartLabel, isToday && c.chartLabelToday]}>{day.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <WeekLineChart data={weeklyData} max={chartMax} todayIndex={todayIndex} />
                    )}
                </View>

                {/* Incidencias reportadas */}
                <View style={[c.chartCard, { width: CARD_W }]}>
                    <View style={c.chartHeader}>
                        <View>
                            <Text style={c.chartEyebrow}>Incidencias Reportadas</Text>
                            <View style={c.chartNumRow}>
                                <Text style={[c.chartBigNum, { color: '#06B6D4' }]}>{incWeekTotal}</Text>
                                <Text style={c.chartWeekLabel}>esta semana</Text>
                            </View>
                        </View>
                        <View style={[c.chartIconBox, { backgroundColor: '#E8F8FB' }]}>
                            <MaterialCommunityIcons name="clipboard-alert-outline" size={24} color="#06B6D4" />
                        </View>
                    </View>
                    <View style={c.chartBars}>
                        {incWeeklyData.map((day, index) => {
                            const isToday = index === todayIndex;
                            const barH = day.count > 0 ? Math.max((day.count / incChartMax) * CHART_H, 8) : 4;
                            return (
                                <View key={day.label} style={c.chartBarCol}>
                                    <View style={c.chartTodayLabelBox}>
                                        {isToday && <Text style={[c.chartTodayLabel, { color: '#06B6D4' }]}>{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][index]}</Text>}
                                    </View>
                                    <View style={c.chartTrack}>
                                        <Animated.View style={[
                                            c.chartBar,
                                            { height: barH, transform: [
                                                { translateY: barProgress.interpolate({ inputRange: [0, 1], outputRange: [barH / 2, 0] }) },
                                                { scaleY: barProgress },
                                            ]},
                                            isToday ? c.chartBarTodayCyan : c.chartBarIdleCyan,
                                        ]}>
                                            {day.count > 0 && barH >= 24 && (
                                                <Text style={[c.chartBarCount, { color: isToday ? '#ffffff' : '#06B6D4' }]}>{day.count}</Text>
                                            )}
                                        </Animated.View>
                                    </View>
                                    <Text style={[c.chartLabel, isToday && { color: '#06B6D4', fontWeight: '800' }]}>{day.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <View style={c.carouselDots}>
                <View style={[c.carouselDot, chartSlide === 0 && c.carouselDotActive]} />
                <View style={[c.carouselDot, chartSlide === 1 && c.carouselDotActiveCyan]} />
            </View>
        </>
    );
}

const c = StyleSheet.create({
    carouselContent:      { paddingHorizontal: 20, gap: 12 },
    carouselDots:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
    carouselDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D9F0' },
    carouselDotActive:    { width: 18, height: 6, borderRadius: 3, backgroundColor: '#2D3FE0' },
    carouselDotActiveCyan:{ width: 18, height: 6, borderRadius: 3, backgroundColor: '#06B6D4' },

    chartCard:   { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    chartEyebrow:{ color: '#8F95B2', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    chartNumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    chartBigNum: { color: '#2D3FE0', fontSize: 36, fontWeight: '800' },
    chartWeekLabel: { color: '#8F95B2', fontSize: 12, fontWeight: '500', paddingBottom: 6 },
    chartIconBox: { backgroundColor: '#E8EDFF', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center' },
    chartIconBoxActive: { backgroundColor: '#2D3FE0', shadowColor: '#2D3FE0', shadowOpacity: 0.30, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    chartBars:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 20 },
    chartBarCol: { flex: 1, alignItems: 'center', gap: 4 },
    chartTodayLabelBox: { height: 18, justifyContent: 'center', alignItems: 'center' },
    chartTodayLabel:    { color: '#2D3FE0', fontSize: 10, fontWeight: '700' },
    chartTrack:  { height: 108, width: '100%', justifyContent: 'flex-end' },
    chartBar:    { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, alignItems: 'center', justifyContent: 'center' },
    chartBarCount:    { fontSize: 10, fontWeight: '800' },
    chartBarIdle:     { backgroundColor: '#DBEAFE' },
    chartBarToday:    { backgroundColor: '#2D3FE0', shadowColor: '#2D3FE0', shadowOpacity: 0.30, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    chartBarIdleCyan: { backgroundColor: '#CFFAFE' },
    chartBarTodayCyan:{ backgroundColor: '#06B6D4', shadowColor: '#06B6D4', shadowOpacity: 0.30, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    chartLabel:      { color: '#8F95B2', fontSize: 10, fontWeight: '700' },
    chartLabelToday: { color: '#2D3FE0', fontWeight: '800' },
});
