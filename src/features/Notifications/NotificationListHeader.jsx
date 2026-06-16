import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function FilterTab({ label, active, onPress }) {
    if (active) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.tabWrapper}>
                <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.tabActive}
                >
                    <Text style={s.tabActiveText}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[s.tabWrapper, s.tabInactive]}>
            <Text style={s.tabInactiveText}>{label}</Text>
        </TouchableOpacity>
    );
}

export function NotificationListHeader({ filter, onFilter, unreadCount, onMarkAllRead }) {
    const router = useRouter();
    return (
        <>
            <Stack.Screen options={{ title: '', headerTransparent: true, headerShadowVisible: false }} />
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.decCircle1} />
                <View style={s.decCircle2} />
                <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.heroContent}>
                    <View>
                        <Text style={s.heroEyebrow}>Bandeja operativa</Text>
                        <Text style={s.heroTitle}>Notificaciones</Text>
                    </View>
                    {unreadCount > 0 && (
                        <View style={s.heroBadge}>
                            <Text style={s.heroBadgeNumber}>{unreadCount}</Text>
                            <Text style={s.heroBadgeLabel}>sin leer</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <View style={s.filterRow}>
                <View style={s.filterTabs}>
                    <FilterTab label="Todas" active={filter === 'all'} onPress={() => onFilter('all')} />
                    <FilterTab
                        label={`No leídas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                        active={filter === 'unread'}
                        onPress={() => onFilter('unread')}
                    />
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={onMarkAllRead} activeOpacity={0.85} style={s.markAllBtn}>
                        <MaterialCommunityIcons name="check-all" size={14} color="#4A6CF7" />
                        <Text style={s.markAllBtnText}>Marcar todo</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}

const s = StyleSheet.create({
    hero:          { paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24, overflow: 'hidden', position: 'relative' },
    decCircle1:    { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
    decCircle2:    { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
    backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroContent:   { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    heroEyebrow:   { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6 },
    heroTitle:     { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    heroBadge:     { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    heroBadgeNumber:{ color: '#ffffff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
    heroBadgeLabel:{ color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600' },
    filterRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
    filterTabs:    { flexDirection: 'row', gap: 10 },
    markAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    markAllBtnText:{ color: '#4A6CF7', fontSize: 12, fontWeight: '700' },
    tabWrapper:    { borderRadius: 999, overflow: 'hidden' },
    tabActive:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
    tabActiveText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
    tabInactive:   { backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 9, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    tabInactiveText:{ color: '#8F95B2', fontSize: 13, fontWeight: '600' },
});
