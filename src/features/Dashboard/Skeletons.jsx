import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function SkeletonChartCard({ shimmer }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    const heights = [50, 30, 70, 20, 60, 40, 35];
    return (
        <View style={sk.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
                {heights.map((h, i) => (
                    <Animated.View key={i} style={{ width: 28, height: h, borderRadius: 6, backgroundColor: '#E8EDFF', opacity }} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <Animated.View key={d} style={{ width: 20, height: 10, borderRadius: 4, backgroundColor: '#E8EDFF', opacity }} />
                ))}
            </View>
        </View>
    );
}

export function SkeletonTimelineRow({ shimmer, isLast }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
    return (
        <View style={{ flexDirection: 'row', minHeight: 56 }}>
            <View style={{ width: 24, alignItems: 'center', paddingTop: 16 }}>
                <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8EDFF', opacity }} />
                {!isLast && <View style={{ position: 'absolute', top: 26, bottom: 0, width: 1.5, backgroundColor: '#F1F3FF' }} />}
            </View>
            <View style={[{ flex: 1, paddingVertical: 14, paddingLeft: 12, gap: 6 }, !isLast && { borderBottomWidth: 1, borderBottomColor: '#F1F3FF' }]}>
                <Animated.View style={[sk.line, { width: '70%', height: 13, opacity }]} />
                <Animated.View style={[sk.line, { width: '40%', height: 11, opacity }]} />
            </View>
        </View>
    );
}

const sk = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff', borderRadius: 20, padding: 18, gap: 12,
        shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 14,
        shadowOffset: { width: 0, height: 3 }, elevation: 1,
    },
    line: { borderRadius: 6, backgroundColor: '#E8EDFF' },
});
