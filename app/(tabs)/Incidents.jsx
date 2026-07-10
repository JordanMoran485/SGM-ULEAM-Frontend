import React from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIncidents } from '../../src/features/Incidents/useIncidents';
import { IncidentListHeader } from '../../src/features/Incidents/IncidentListHeader';
import { getEffectiveStatus, getStatusConfig, parseLocation, formatRelative, SPACE_TYPE_ICONS } from '../../src/features/Incidents/helpers';

export default function IncidentsScreen() {
    const router = useRouter();
    const refreshOffset = 120;
    const {
        displayedItems, filteredItems, hasMore, loadMore,
        refreshing, refreshScreen,
        search, setSearch,
        statusFilter, setStatusFilter,
        counts,
        scrollAnim,
        onContentSizeChange, onLayout,
        showMinimap, indicatorHeight, indicatorTop,
    } = useIncidents();

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                style={s.container}
                contentContainerStyle={s.content}
                data={displayedItems}
                keyExtractor={(item) => String(item.id)}
                refreshing={refreshing}
                onRefresh={refreshScreen}
                progressViewOffset={refreshOffset}
                removeClippedSubviews={true}
                maxToRenderPerBatch={8}
                windowSize={5}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={hasMore ? (
                    <View style={s.footerLoader}>
                        <MaterialCommunityIcons name="dots-horizontal" size={22} color="#C7D2FE" />
                    </View>
                ) : null}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
                    { useNativeDriver: false }
                )}
                onContentSizeChange={onContentSizeChange}
                onLayout={onLayout}
                ListHeaderComponent={
                    <IncidentListHeader
                        search={search}
                        onSearch={setSearch}
                        statusFilter={statusFilter}
                        onStatusFilter={setStatusFilter}
                        counts={counts}
                        filteredCount={filteredItems.length}
                    />
                }
                renderItem={({ item }) => {
                    const effective = getEffectiveStatus(item.status, item.approvalStatus);
                    const sc = getStatusConfig(effective);
                    const { spaceType, address } = parseLocation(item.location);
                    return (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={s.card}
                            onPress={() => router.push({
                                pathname: '/IncidentDetail',
                                params: { id: String(item.id), type: 'incident' },
                            })}
                        >
                            <View style={[s.stripe, { backgroundColor: sc.stripe }]} />
                            <View style={[s.cardIconBox, { backgroundColor: sc.iconBg }]}>
                                <MaterialCommunityIcons
                                    name={SPACE_TYPE_ICONS[spaceType] ?? 'alert-circle-outline'}
                                    size={22}
                                    color={sc.iconColor}
                                />
                            </View>
                            <View style={s.cardInfo}>
                                <View style={s.cardTopRow}>
                                    <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={s.cardTime}>{formatRelative(item.createdAt)}</Text>
                                </View>
                                {address && (
                                    <Text style={s.cardLocation} numberOfLines={1}>{address}</Text>
                                )}
                                <View style={s.cardTags}>
                                    <View style={[s.cardTag, { backgroundColor: sc.badgeBg }]}>
                                        <Text style={[s.cardTagText, { color: sc.badgeText }]}>{sc.label}</Text>
                                    </View>
                                    {spaceType && (
                                        <View style={s.cardSpaceTag}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={11} color="#4A6CF7" />
                                            <Text style={s.cardSpaceTagText}>{spaceType}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={22} color="#C7D2FE" />
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={s.emptyWrapper}>
                        <LinearGradient
                            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={s.emptyDecoCard}
                        >
                            <View style={s.emptyDecoCircle} />
                            <MaterialCommunityIcons name="clipboard-text-off-outline" size={36} color="rgba(255,255,255,0.9)" />
                        </LinearGradient>
                        <Text style={s.emptyTitle}>Sin resultados</Text>
                        <Text style={s.emptyText}>Prueba con otro filtro o actualiza la lista.</Text>
                        {statusFilter !== 'all' && (
                            <TouchableOpacity onPress={() => setStatusFilter('all')} activeOpacity={0.85} style={s.emptyAction}>
                                <Text style={s.emptyActionText}>Ver todas</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
            {showMinimap && (
                <View style={mm.track} pointerEvents="none">
                    <Animated.View style={[mm.indicator, { height: indicatorHeight, transform: [{ translateY: indicatorTop }] }]} />
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#EEF2FF' },
    content:      { paddingBottom: 40 },
    card:         { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 20, marginTop: 16, padding: 16, paddingLeft: 20, overflow: 'hidden', shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    stripe:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardIconBox:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardInfo:     { flex: 1, minWidth: 0, gap: 4 },
    cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle:    { flex: 1, color: '#1A1F36', fontSize: 14, fontWeight: '800' },
    cardTime:     { color: '#8F95B2', fontSize: 10, fontWeight: '500', marginLeft: 8, flexShrink: 0 },
    cardLocation: { color: '#8F95B2', fontSize: 12, fontWeight: '500' },
    cardTags:     { flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' },
    cardTag:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    cardTagText:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardSpaceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8EDFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    cardSpaceTagText: { color: '#4A6CF7', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyWrapper: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48, gap: 16 },
    emptyDecoCard:   { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    emptyDecoCircle: { position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.12)' },
    emptyTitle:   { color: '#1A1F36', fontSize: 20, fontWeight: '800', textAlign: 'center' },
    emptyText:    { color: '#8F95B2', fontSize: 14, lineHeight: 21, textAlign: 'center' },
    emptyAction:  { backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
    emptyActionText: { color: '#4A6CF7', fontSize: 13, fontWeight: '700' },
    footerLoader: { alignItems: 'center', paddingVertical: 16 },
});

const mm = StyleSheet.create({
    track:     { position: 'absolute', right: 4, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(74,108,247,0.10)', borderRadius: 999 },
    indicator: { width: 4, borderRadius: 999, backgroundColor: '#4A6CF7', opacity: 0.55 },
});
