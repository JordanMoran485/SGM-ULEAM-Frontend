import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomSearchBar } from '../../components/CustomSearchBar';
import { StatusTab } from './StatusTab';
import { FILTERS } from './helpers';

export function IncidentListHeader({ search, onSearch, statusFilter, onStatusFilter, counts, filteredCount }) {
    const router = useRouter();
    return (
        <>
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.decCircle1} />
                <View style={s.decCircle2} />

                <View style={{ position: 'absolute', top: 18, left: '8%', transform: [{ rotate: '-10deg' }] }}>
                    <MaterialCommunityIcons name="camera-outline" size={44} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: 'absolute', top: 10, left: '40%', transform: [{ rotate: '14deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-alert-outline" size={64} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: 'absolute', top: 20, right: '10%', transform: [{ rotate: '-16deg' }] }}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={50} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: 14, left: '6%', transform: [{ rotate: '18deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={56} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: 10, left: '42%', transform: [{ rotate: '-8deg' }] }}>
                    <MaterialCommunityIcons name="camera-outline" size={52} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: -28, right: -18, transform: [{ rotate: '15deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={148} color="rgba(255,255,255,0.07)" />
                </View>

                <View style={s.heroRow}>
                    <View>
                        <Text style={s.heroEyebrow}>Seguimiento</Text>
                        <Text style={s.heroTitle}>Incidencias</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push('/ReportIncident')}
                        style={s.heroNewBtn}
                    >
                        <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                        <Text style={s.heroNewBtnText}>Nueva</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={s.searchWrapper}>
                <CustomSearchBar
                    onChangeText={onSearch}
                    value={search}
                    placeholder="Buscar incidencia, ubicación o responsable"
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.tabsRow}
                style={s.tabsScroll}
            >
                {FILTERS.map((f) => (
                    <StatusTab
                        key={f.key}
                        label={f.label}
                        active={statusFilter === f.key}
                        count={f.key === 'all' ? counts.all : counts[f.key]}
                        onPress={() => onStatusFilter(f.key)}
                    />
                ))}
            </ScrollView>

            {search.trim() !== '' && (
                <Text style={s.resultsCount}>
                    {filteredCount} resultado{filteredCount !== 1 ? 's' : ''}
                </Text>
            )}
        </>
    );
}

const s = StyleSheet.create({
    hero:         { paddingTop: 72, paddingBottom: 44, paddingHorizontal: 24, overflow: 'hidden' },
    decCircle1:   { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
    decCircle2:   { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroRow:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    heroEyebrow:  { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6 },
    heroTitle:    { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    heroNewBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginBottom: 4 },
    heroNewBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
    searchWrapper:{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    tabsScroll:   { marginTop: 12 },
    tabsRow:      { flexDirection: 'row', paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
    resultsCount: { color: '#8F95B2', fontSize: 12, fontWeight: '500', paddingHorizontal: 24, marginTop: 12, marginBottom: 4 },
});
