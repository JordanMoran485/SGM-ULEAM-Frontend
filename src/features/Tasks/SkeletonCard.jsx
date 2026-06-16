import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export const SkeletonCard = React.memo(function SkeletonCard({ shimmer }) {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
    return (
        <View style={[s.card, { paddingLeft: 20 }]}>
            <Animated.View style={[sk.stripe, { opacity }]} />
            <Animated.View style={[sk.iconBox, { opacity }]} />
            <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Animated.View style={[sk.titleBar, { opacity }]} />
                    <Animated.View style={[sk.timeBar, { opacity }]} />
                </View>
                <Animated.View style={[sk.locationBar, { opacity }]} />
                <Animated.View style={[sk.tagPill, { opacity }]} />
            </View>
            <Animated.View style={[sk.chevron, { opacity }]} />
        </View>
    );
});

const s = StyleSheet.create({
    card: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 20, marginTop: 12, padding: 16, overflow: 'hidden', shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
});

const sk = StyleSheet.create({
    stripe:      { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#C7D2FE' },
    iconBox:     { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8EDFF', flexShrink: 0 },
    titleBar:    { width: '62%', height: 14, borderRadius: 6,  backgroundColor: '#C7D2FE' },
    timeBar:     { width: 36,   height: 10, borderRadius: 4,  backgroundColor: '#E8EDFF' },
    locationBar: { width: '45%', height: 11, borderRadius: 5,  backgroundColor: '#E8EDFF' },
    tagPill:     { width: 72,   height: 22, borderRadius: 999, backgroundColor: '#E8EDFF' },
    chevron:     { width: 22,   height: 22, borderRadius: 6,  backgroundColor: '#E8EDFF' },
});
