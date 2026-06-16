import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useShimmer } from '../../hooks/useShimmer';

export function CalendarSkeletonScreen() {
    const shimmer = useShimmer(700);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.heroDeco1} />
                <View style={s.heroDeco2} />
                <View style={s.backBtn} />
                <View style={[s.heroRow, { marginBottom: 20 }]}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <Animated.View style={[sk.eyebrowBar, { opacity }]} />
                        <Animated.View style={[sk.titleHeroBar, { opacity }]} />
                    </View>
                </View>
                <View style={s.statRow}>
                    {[0, 1, 2].map((i) => (
                        <Animated.View key={i} style={[s.statCard, { opacity }]}>
                            <View style={[s.statIcon, { backgroundColor: '#E8EDFF' }]} />
                            <View style={sk.statNumBar} />
                            <View style={sk.statLabelBar} />
                        </Animated.View>
                    ))}
                </View>
            </LinearGradient>

            <View style={s.exportWrap}>
                <Animated.View style={[sk.exportBar, { opacity }]} />
            </View>

            <View style={s.weekCard}>
                <View style={s.weekHeader}>
                    <Animated.View style={[sk.navBtn, { opacity }]} />
                    <Animated.View style={[sk.monthLabelBar, { opacity }]} />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Animated.View style={[sk.navBtn, { opacity }]} />
                        <Animated.View style={[sk.navBtn, { opacity }]} />
                    </View>
                </View>
                <View style={s.weekDaysRow}>
                    {[...Array(7)].map((_, i) => (
                        <Animated.View key={i} style={[sk.weekDayCell, { backgroundColor: i === 3 ? '#C7D2FE' : '#E8EDFF', opacity }]} />
                    ))}
                </View>
            </View>

            <View style={s.viewToggleRow}>
                <Animated.View style={[sk.toggleActive, { opacity }]} />
                <Animated.View style={[sk.toggleInactive, { opacity }]} />
            </View>

            <View style={s.agendaCard}>
                <View style={s.agendaHeader}>
                    <View style={{ gap: 6 }}>
                        <Animated.View style={[sk.eyebrowSmall, { opacity }]} />
                        <Animated.View style={[sk.agendaTitleBar, { opacity }]} />
                    </View>
                    <Animated.View style={[sk.countPill, { opacity }]} />
                </View>
                <View style={{ height: 1, backgroundColor: '#F1F3FF', marginBottom: 12 }} />
                {[...Array(3)].map((_, i) => (
                    <View key={i} style={[s.taskCard, { marginBottom: 10 }]}>
                        <Animated.View style={[{ width: 4, backgroundColor: '#C7D2FE', opacity }]} />
                        <View style={s.taskBody}>
                            <Animated.View style={[sk.taskBadgeBar, { opacity }]} />
                            <Animated.View style={[sk.taskTitleBar, { opacity }]} />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                <Animated.View style={[sk.taskMetaBar, { opacity }]} />
                                <Animated.View style={[sk.taskMetaBar, { opacity }]} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#EEF2FF' },
    content:     { paddingBottom: 48 },
    hero:        { paddingTop: 56, paddingBottom: 0, paddingHorizontal: 24, overflow: 'hidden' },
    heroDeco1:   { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroDeco2:   { position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },
    backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
    heroRow:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    statRow:     { flexDirection: 'row', gap: 10 },
    statCard:    { flex: 1, height: 104, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6 },
    statIcon:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    exportWrap:  { paddingHorizontal: 20, paddingTop: 20 },
    weekCard:    { marginHorizontal: 20, marginTop: 20, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 20, padding: 16 },
    weekHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    viewToggleRow:{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
    agendaCard:  { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
    agendaHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    taskCard:    { flexDirection: 'row', backgroundColor: '#F8F9FF', borderRadius: 16, overflow: 'hidden' },
    taskBody:    { flex: 1, padding: 14, gap: 5 },
});

const sk = StyleSheet.create({
    eyebrowBar:    { width: 130, height: 12, borderRadius: 6,   backgroundColor: 'rgba(255,255,255,0.30)' },
    titleHeroBar:  { width: 160, height: 28, borderRadius: 8,   backgroundColor: 'rgba(255,255,255,0.30)' },
    statNumBar:    { width: 30,  height: 20, borderRadius: 6,   backgroundColor: '#C7D2FE', marginTop: 2 },
    statLabelBar:  { width: 50,  height: 10, borderRadius: 4,   backgroundColor: '#E8EDFF', marginTop: 2 },
    exportBar:     { height: 52, borderRadius: 20, backgroundColor: '#C7D2FE' },
    navBtn:        { width: 40,  height: 40, borderRadius: 12, backgroundColor: '#E8EDFF' },
    monthLabelBar: { width: 140, height: 16, borderRadius: 6,   backgroundColor: '#C7D2FE' },
    weekDayCell:   { flex: 1,    height: 72, borderRadius: 14 },
    toggleActive:  { width: 72,  height: 38, borderRadius: 999, backgroundColor: '#C7D2FE' },
    toggleInactive:{ width: 96,  height: 38, borderRadius: 999, backgroundColor: '#E8EDFF' },
    eyebrowSmall:  { width: 120, height: 10, borderRadius: 4,   backgroundColor: '#E8EDFF' },
    agendaTitleBar:{ width: 200, height: 20, borderRadius: 6,   backgroundColor: '#C7D2FE' },
    countPill:     { width: 48,  height: 30, borderRadius: 999, backgroundColor: '#E8EDFF' },
    taskBadgeBar:  { width: 70,  height: 22, borderRadius: 999, backgroundColor: '#E8EDFF' },
    taskTitleBar:  { width: '75%', height: 14, borderRadius: 6, backgroundColor: '#C7D2FE', marginTop: 4 },
    taskMetaBar:   { flex: 1,    height: 24, borderRadius: 999, backgroundColor: '#E8EDFF' },
});
