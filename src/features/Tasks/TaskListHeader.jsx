import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomSearchBar } from '../../components/CustomSearchBar';
import { StatusTab } from '../Incidents/StatusTab';
import { FILTERS } from './helpers';

export function TaskListHeader({ screenTitle, counts, search, onSearch, statusFilter, onStatusFilter, filteredCount }) {
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
                    <MaterialCommunityIcons name="broom" size={44} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: 'absolute', top: 10, left: '40%', transform: [{ rotate: '14deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: 'absolute', top: 20, right: '10%', transform: [{ rotate: '-16deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={50} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: 14, left: '6%', transform: [{ rotate: '18deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={56} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: 10, left: '42%', transform: [{ rotate: '-8deg' }] }}>
                    <MaterialCommunityIcons name="brush" size={52} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: 'absolute', bottom: -28, right: -18, transform: [{ rotate: '15deg' }] }}>
                    <MaterialCommunityIcons name="clipboard-edit-outline" size={148} color="rgba(255,255,255,0.07)" />
                </View>

                <View style={s.heroRow}>
                    <View>
                        <Text style={s.heroEyebrow}>Trabajo asignado</Text>
                        <Text style={s.heroTitle}>{screenTitle}</Text>
                    </View>
                    <View style={s.heroBadge}>
                        <Text style={s.heroBadgeNum}>{counts.all}</Text>
                        <Text style={s.heroBadgeLabel}>tareas</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={s.searchWrapper}>
                <CustomSearchBar
                    onChangeText={onSearch}
                    value={search}
                    placeholder="Buscar por tarea, ubicación o prioridad"
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

            <View style={s.listHeader}>
                <Text style={s.listTitle}>Bandeja de tareas</Text>
                <View style={s.listCountPill}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={13} color="#4A6CF7" />
                    <Text style={s.listCountText}>{filteredCount}</Text>
                </View>
            </View>

            {search.trim() !== '' && (
                <Text style={s.resultsCount}>
                    {filteredCount} resultado{filteredCount !== 1 ? 's' : ''}
                </Text>
            )}
        </>
    );
}

const s = StyleSheet.create({
    hero:          { paddingTop: 72, paddingBottom: 44, paddingHorizontal: 24, overflow: 'hidden' },
    decCircle1:    { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
    decCircle2:    { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroRow:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    heroEyebrow:   { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    heroTitle:     { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    heroBadge:     { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    heroBadgeNum:  { color: '#ffffff', fontSize: 22, fontWeight: '800' },
    heroBadgeLabel:{ color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600' },
    searchWrapper: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    tabsScroll:    { marginTop: 12 },
    tabsRow:       { flexDirection: 'row', paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
    listHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16, marginBottom: 4 },
    listTitle:     { color: '#1A1F36', fontSize: 17, fontWeight: '700' },
    listCountPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    listCountText: { color: '#4A6CF7', fontSize: 13, fontWeight: '800' },
    resultsCount:  { color: '#8F95B2', fontSize: 12, fontWeight: '500', paddingHorizontal: 24, marginTop: 4, marginBottom: 4 },
});
