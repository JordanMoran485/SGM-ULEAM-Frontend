import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useShimmer } from '../../hooks/useShimmer';
import { SkeletonCard } from './SkeletonCard';

export function TaskSkeletonScreen() {
    const shimmer = useShimmer();
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.decCircle1} />
                <View style={s.decCircle2} />
                <View style={s.heroRow}>
                    <View style={{ gap: 10 }}>
                        <Animated.View style={[sk.eyebrowBar, { opacity }]} />
                        <Animated.View style={[sk.titleHeroBar, { opacity }]} />
                    </View>
                    <Animated.View style={[sk.heroBadgeBox, { opacity }]} />
                </View>
            </LinearGradient>

            <View style={s.searchWrapper}>
                <Animated.View style={[sk.searchBar, { opacity }]} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow} style={s.tabsScroll}>
                {[80, 106, 110, 118].map((w, i) => (
                    <Animated.View key={i} style={[sk.tabPill, { width: w, backgroundColor: i === 0 ? '#C7D2FE' : '#E8EDFF', opacity }]} />
                ))}
            </ScrollView>

            <View style={[s.listHeader, { marginTop: 16 }]}>
                <Animated.View style={[sk.listTitleBar, { opacity }]} />
                <Animated.View style={[sk.listCountBox, { opacity }]} />
            </View>

            {[...Array(5)].map((_, i) => <SkeletonCard key={i} shimmer={shimmer} />)}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#EEF2FF' },
    content:     { paddingBottom: 48 },
    hero:        { paddingTop: 72, paddingBottom: 44, paddingHorizontal: 24, overflow: 'hidden' },
    decCircle1:  { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
    decCircle2:  { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroRow:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    searchWrapper:{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    tabsScroll:  { marginTop: 12 },
    tabsRow:     { flexDirection: 'row', paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
    listHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 4 },
});

const sk = StyleSheet.create({
    eyebrowBar:   { width: 120, height: 12, borderRadius: 6,   backgroundColor: 'rgba(255,255,255,0.30)' },
    titleHeroBar: { width: 180, height: 28, borderRadius: 10,  backgroundColor: 'rgba(255,255,255,0.30)' },
    heroBadgeBox: { width: 72,  height: 64, borderRadius: 16,  backgroundColor: 'rgba(255,255,255,0.20)' },
    searchBar:    { height: 48, borderRadius: 16, backgroundColor: '#C7D2FE' },
    tabPill:      { height: 38, borderRadius: 999 },
    listTitleBar: { width: 150, height: 18, borderRadius: 6,   backgroundColor: '#C7D2FE' },
    listCountBox: { width: 52,  height: 30, borderRadius: 999, backgroundColor: '#E8EDFF' },
});
