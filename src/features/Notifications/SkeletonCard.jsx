import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export const SkeletonCard = React.memo(function SkeletonCard({ shimmer }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    return (
        <View style={s.card}>
            <View style={[s.unreadStripe, { backgroundColor: '#E8EDFF' }]} />
            <View style={s.cardInner}>
                <View style={s.cardTopRow}>
                    <Animated.View style={[s.skeletonPill, { width: 72, opacity }]} />
                    <Animated.View style={[s.skeletonLine, { width: 44, height: 12, opacity }]} />
                </View>
                <Animated.View style={[s.skeletonLine, { width: '78%', height: 15, opacity }]} />
                <Animated.View style={[s.skeletonLine, { width: '100%', height: 12, opacity }]} />
                <Animated.View style={[s.skeletonLine, { width: '55%', height: 12, opacity }]} />
                <View style={[s.cardBottomRow, { marginTop: 4 }]}>
                    <Animated.View style={[s.skeletonPill, { width: 96, opacity }]} />
                    <Animated.View style={[s.skeletonPill, { width: 58, opacity }]} />
                </View>
            </View>
        </View>
    );
});

const s = StyleSheet.create({
    card:        { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden', shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    unreadStripe:{ width: 4, backgroundColor: '#4A6CF7', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
    cardInner:   { flex: 1, padding: 16, gap: 6 },
    cardTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardBottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skeletonLine:{ height: 13, borderRadius: 6, backgroundColor: '#E8EDFF' },
    skeletonPill:{ height: 24, borderRadius: 999, backgroundColor: '#E8EDFF' },
});
