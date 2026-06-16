import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const StatusTab = React.memo(function StatusTab({ label, active, count, onPress }) {
    if (active) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.tabWrapper}>
                <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.tabActive}
                >
                    <Text style={s.tabActiveText}>{label}</Text>
                    {count !== undefined && (
                        <View style={s.tabBadge}>
                            <Text style={s.tabBadgeText}>{count}</Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[s.tabWrapper, s.tabInactive]}>
            <Text style={s.tabInactiveText}>{label}</Text>
            {count !== undefined && count > 0 && (
                <View style={s.tabBadgeInactive}>
                    <Text style={s.tabBadgeInactiveText}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
});

const s = StyleSheet.create({
    tabWrapper:          { borderRadius: 999, overflow: 'hidden' },
    tabActive:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
    tabActiveText:       { color: '#ffffff', fontSize: 13, fontWeight: '700' },
    tabBadge:            { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    tabBadgeText:        { color: '#ffffff', fontSize: 10, fontWeight: '800' },
    tabInactive:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 9, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    tabInactiveText:     { color: '#8F95B2', fontSize: 13, fontWeight: '600' },
    tabBadgeInactive:    { backgroundColor: '#E8EDFF', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    tabBadgeInactiveText:{ color: '#4A6CF7', fontSize: 10, fontWeight: '700' },
});
