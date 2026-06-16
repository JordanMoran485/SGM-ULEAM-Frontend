import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatRelative, getSpaceIcon, getStatusConfig, parseLocation } from './helpers';
import { SkeletonTimelineRow } from './Skeletons';

export function ActivityFeed({ recentActivity, incidentsLoaded, shimmer, router }) {
    return (
        <View style={a.section}>
            <View style={a.sectionRow}>
                <Text style={a.sectionTitle}>Actividad reciente</Text>
                {incidentsLoaded && recentActivity.length > 0 && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={a.sectionLink}
                        onPress={() => router.push('/(tabs)/Incidents')}
                    >
                        <Text style={a.sectionLinkText}>Ver todas</Text>
                        <MaterialCommunityIcons name="arrow-right" size={13} color="#4A6CF7" />
                    </TouchableOpacity>
                )}
            </View>

            {!incidentsLoaded ? (
                <View style={a.timelineCard}>
                    {[0, 1, 2, 3].map((i) => (
                        <SkeletonTimelineRow key={i} shimmer={shimmer} isLast={i === 3} />
                    ))}
                </View>
            ) : recentActivity.length === 0 ? (
                <View style={a.emptyCard}>
                    <LinearGradient
                        colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={a.emptyIconBox}
                    >
                        <View style={a.emptyIconDeco} />
                        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={30} color="rgba(255,255,255,0.9)" />
                    </LinearGradient>
                    <Text style={a.emptyTitle}>Sin actividad reciente</Text>
                    <Text style={a.emptyBody}>Las incidencias que registres aparecerán aquí.</Text>
                </View>
            ) : (
                recentActivity.map((item) => {
                    const sc = getStatusConfig(item.status);
                    const { spaceType, address } = parseLocation(item.location);
                    return (
                        <TouchableOpacity
                            key={String(item.id)}
                            activeOpacity={0.85}
                            style={a.activityCard}
                            onPress={() => router.push({ pathname: '/IncidentDetail', params: { id: String(item.id), type: 'incident' } })}
                        >
                            <View style={[a.activityIconBox, { backgroundColor: sc.iconBg }]}>
                                <MaterialCommunityIcons name={getSpaceIcon(spaceType)} size={22} color={sc.iconColor} />
                            </View>
                            <View style={a.activityInfo}>
                                <View style={a.activityTopRow}>
                                    <Text style={a.activityTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={a.activityTime}>{formatRelative(item.createdAt)}</Text>
                                </View>
                                {address && <Text style={a.activityLocation} numberOfLines={1}>{address}</Text>}
                                {spaceType && (
                                    <View style={a.activitySpaceChip}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={11} color="#4A6CF7" />
                                        <Text style={a.activitySpaceChipText}>{spaceType}</Text>
                                    </View>
                                )}
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={22} color="#C7D2FE" />
                        </TouchableOpacity>
                    );
                })
            )}
        </View>
    );
}

const a = StyleSheet.create({
    section:    { paddingHorizontal: 20, paddingTop: 24 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: '#1A1F36', fontSize: 17, fontWeight: '700', marginBottom: 14 },
    sectionLink:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
    sectionLinkText: { color: '#4A6CF7', fontSize: 12, fontWeight: '700' },

    timelineCard: { backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },

    emptyCard:    { backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', gap: 12, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    emptyIconBox: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    emptyIconDeco:{ position: 'absolute', top: -16, right: -16, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)' },
    emptyTitle:   { color: '#1A1F36', fontSize: 16, fontWeight: '800', textAlign: 'center' },
    emptyBody:    { color: '#8F95B2', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 240 },

    activityCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    activityIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    activityInfo:    { flex: 1, minWidth: 0, gap: 4 },
    activityTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    activityTitle:   { flex: 1, color: '#1A1F36', fontSize: 14, fontWeight: '800' },
    activityTime:    { color: '#8F95B2', fontSize: 10, fontWeight: '500', marginLeft: 8, flexShrink: 0 },
    activityLocation:{ color: '#8F95B2', fontSize: 12, fontWeight: '500' },
    activitySpaceChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    activitySpaceChipText:{ color: '#4A6CF7', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
