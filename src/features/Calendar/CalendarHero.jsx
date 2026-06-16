import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function CalendarHero({ visibleItems, pendingCount, inProgressCount, isConcierge, isExporting, onExport }) {
    const router = useRouter();
    return (
        <>
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.heroDeco1} />
                <View style={s.heroDeco2} />

                <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={s.heroRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.heroEyebrow}>AGENDA OPERATIVA</Text>
                        <Text style={s.heroTitle}>Calendario</Text>
                    </View>
                </View>

                <View style={s.statRow}>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#E8EDFF' }]}>
                            <MaterialCommunityIcons name="calendar-check-outline" size={17} color="#4A6CF7" />
                        </View>
                        <Text style={s.statNum}>{visibleItems.length}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>Total</Text>
                    </View>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={17} color="#F59E0B" />
                        </View>
                        <Text style={s.statNum}>{pendingCount}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>Pendientes</Text>
                    </View>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#E8F8FB' }]}>
                            <MaterialCommunityIcons name="progress-clock" size={17} color="#06B6D4" />
                        </View>
                        <Text style={s.statNum}>{inProgressCount}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>En progreso</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={s.exportWrap}>
                <TouchableOpacity activeOpacity={0.85} style={s.exportBtn} onPress={onExport} disabled={isExporting}>
                    <LinearGradient
                        colors={['#2D3FE0', '#4A6CF7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.exportBtnGradient}
                    >
                        <MaterialCommunityIcons name={isExporting ? 'loading' : 'download-outline'} size={18} color="#fff" />
                        <Text style={s.exportBtnText}>
                            {isExporting ? 'Generando...' : isConcierge ? 'Descargar mi horario' : 'Descargar agenda'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    );
}

const s = StyleSheet.create({
    hero:           { paddingTop: 56, paddingBottom: 0, paddingHorizontal: 24, overflow: 'hidden' },
    heroDeco1:      { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroDeco2:      { position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },
    backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroRow:        { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
    heroEyebrow:    { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    heroTitle:      { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    statRow:        { flexDirection: 'row', gap: 10 },
    statCard:       { flex: 1, height: 104, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#2D3FE0', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    statIcon:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    statNum:        { color: '#1A1F36', fontSize: 22, fontWeight: '800' },
    statLabel:      { color: '#8F95B2', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    exportWrap:     { paddingHorizontal: 20, paddingTop: 20 },
    exportBtn:      { borderRadius: 20, overflow: 'hidden' },
    exportBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 15 },
    exportBtnText:  { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
