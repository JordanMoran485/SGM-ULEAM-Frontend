import React from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../src/features/Notifications/useNotifications';
import { NotificationListHeader } from '../../src/features/Notifications/NotificationListHeader';
import { SkeletonCard } from '../../src/features/Notifications/SkeletonCard';
import { getNotificationType, formatRelativeDate } from '../../src/features/Notifications/helpers';

export default function NotificationsScreen() {
    const {
        notificationsLoaded, isLoading, shimmer, scrollAnim,
        filter, setFilter,
        unreadCount,
        displayedNotifications, hasMore,
        onRefresh, loadMore,
        handleOpen, handleMarkAllRead,
        onContentSizeChange, onLayout,
        showMinimap, indicatorHeight, indicatorTop,
    } = useNotifications();

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                style={s.container}
                contentContainerStyle={s.content}
                data={displayedNotifications}
                keyExtractor={(item) => String(item.id)}
                refreshing={isLoading && notificationsLoaded}
                onRefresh={onRefresh}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={8}
                windowSize={5}
                onEndReached={() => { if (hasMore) loadMore(); }}
                onEndReachedThreshold={0.4}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
                    { useNativeDriver: false }
                )}
                onContentSizeChange={onContentSizeChange}
                onLayout={onLayout}
                ListFooterComponent={hasMore ? (
                    <View style={s.footerDots}>
                        <MaterialCommunityIcons name="dots-horizontal" size={22} color="#C7D2FE" />
                    </View>
                ) : null}
                ListHeaderComponent={
                    <NotificationListHeader
                        filter={filter}
                        onFilter={setFilter}
                        unreadCount={unreadCount}
                        onMarkAllRead={handleMarkAllRead}
                    />
                }
                ListEmptyComponent={
                    !notificationsLoaded ? (
                        <View>{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} shimmer={shimmer} />)}</View>
                    ) : (
                        <View style={s.emptyWrapper}>
                            <LinearGradient
                                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={s.emptyDecoCard}
                            >
                                <View style={s.emptyDecoCircle} />
                                <MaterialCommunityIcons name="bell-sleep-outline" size={36} color="rgba(255,255,255,0.9)" />
                            </LinearGradient>
                            <Text style={s.emptyTitle}>
                                {filter === 'unread' ? 'Todo al día' : 'Sin notificaciones'}
                            </Text>
                            <Text style={s.emptyText}>
                                {filter === 'unread'
                                    ? 'No tienes notificaciones pendientes de leer.'
                                    : 'Cuando el supervisor te asigne una tarea, aparecerá aquí.'}
                            </Text>
                            {filter === 'unread' && (
                                <TouchableOpacity onPress={() => setFilter('all')} activeOpacity={0.85} style={s.emptyAction}>
                                    <Text style={s.emptyActionText}>Ver todas</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }
                renderItem={({ item: notification }) => {
                    const type        = getNotificationType(notification);
                    const isNavigable = !!(notification.taskId || notification.incidentId || notification.notificationType === 'week_summary');
                    return (
                        <TouchableOpacity
                            onPress={() => handleOpen(notification)}
                            activeOpacity={0.85}
                            style={s.card}
                        >
                            {!notification.isRead && <View style={[s.unreadStripe, { backgroundColor: type.stripe }]} />}
                            <View style={s.cardInner}>
                                <View style={s.cardTopRow}>
                                    <View style={[s.typeBadge, { backgroundColor: type.bg }]}>
                                        <Text style={[s.typeBadgeText, { color: type.text }]}>{type.label}</Text>
                                    </View>
                                    <Text style={s.timestamp}>{formatRelativeDate(notification.createdAt)}</Text>
                                </View>
                                <Text style={s.cardTitle}>{notification.title}</Text>
                                <Text style={s.cardBody} numberOfLines={2}>{notification.body}</Text>
                                <View style={s.cardBottomRow}>
                                    {notification.location ? (
                                        <View style={s.locationChip}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#8F95B2" />
                                            <Text style={s.locationText} numberOfLines={1}>{notification.location}</Text>
                                        </View>
                                    ) : (
                                        <View />
                                    )}
                                    {isNavigable && (
                                        <TouchableOpacity onPress={() => handleOpen(notification)} activeOpacity={0.85} style={s.actionBtn}>
                                            <Text style={s.actionBtnText}>
                                                {notification.notificationType === 'week_summary' ? 'Ver semana' : 'Ver'}
                                            </Text>
                                            <MaterialCommunityIcons name="arrow-right" size={13} color="#4A6CF7" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
            {showMinimap && (
                <Animated.View pointerEvents="none" style={[mm.track, { top: 8, bottom: 8 }]}>
                    <Animated.View style={[mm.indicator, { height: indicatorHeight, transform: [{ translateY: indicatorTop }] }]} />
                </Animated.View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#EEF2FF' },
    content:      { paddingBottom: 40 },
    card:         { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden', shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    unreadStripe: { width: 4, backgroundColor: '#4A6CF7', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
    cardInner:    { flex: 1, padding: 16, gap: 6 },
    cardTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    typeBadge:    { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    typeBadgeText:{ fontSize: 11, fontWeight: '700' },
    timestamp:    { color: '#8F95B2', fontSize: 12, fontWeight: '500' },
    cardTitle:    { color: '#1A1F36', fontSize: 15, fontWeight: '800', lineHeight: 20 },
    cardBody:     { color: '#8F95B2', fontSize: 13, lineHeight: 19 },
    cardBottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    locationChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F3FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '60%' },
    locationText: { color: '#8F95B2', fontSize: 11, fontWeight: '600' },
    actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
    actionBtnText:{ color: '#4A6CF7', fontSize: 12, fontWeight: '700' },
    emptyWrapper: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 32, gap: 16 },
    emptyDecoCard:   { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    emptyDecoCircle: { position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.12)' },
    emptyTitle:   { color: '#1A1F36', fontSize: 20, fontWeight: '800', textAlign: 'center' },
    emptyText:    { color: '#8F95B2', fontSize: 14, lineHeight: 21, textAlign: 'center' },
    emptyAction:  { backgroundColor: '#E8EDFF', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
    emptyActionText: { color: '#4A6CF7', fontSize: 13, fontWeight: '700' },
    footerDots:   { alignItems: 'center', paddingVertical: 16 },
});

const mm = StyleSheet.create({
    track:     { position: 'absolute', right: 4, width: 4, borderRadius: 2, backgroundColor: 'rgba(74,108,247,0.10)' },
    indicator: { width: 4, borderRadius: 2, backgroundColor: '#4A6CF7', opacity: 0.55 },
});
