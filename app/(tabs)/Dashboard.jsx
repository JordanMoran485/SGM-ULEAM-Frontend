import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDashboard } from '../../src/features/Dashboard/useDashboard';
import { ChartCarousel } from '../../src/features/Dashboard/ChartCarousel';
import { ActivityFeed } from '../../src/features/Dashboard/ActivityFeed';
import { SkeletonChartCard } from '../../src/features/Dashboard/Skeletons';
import { getInitials, getGreeting } from '../../src/features/Dashboard/helpers';

export default function Dashboard() {
    const router = useRouter();
    const [chartSlide,    setChartSlide]    = useState(0);
    const [taskChartType, setTaskChartType] = useState('bar');

    const {
        user, stats, incidentsLoaded, tasksLoaded,
        shimmer, barProgress,
        chartMax, incChartMax, todayIndex,
        weeklyData, weekTotal,
        incWeeklyData, incWeekTotal,
        recentActivity, userName, unreadCount,
    } = useDashboard();

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ title: '', headerTransparent: true, headerShadowVisible: false }} />

            {/* ── Hero ── */}
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
            >
                <View style={s.heroDecoClip} pointerEvents="none">
                    <View style={s.heroDeco1} />
                    <View style={s.heroDeco2} />
                </View>

                <View style={s.heroTopRow}>
                    <View style={s.heroAvatar}>
                        {user?.profile_photo_url ? (
                            <Image source={{ uri: user.profile_photo_url }} style={s.heroAvatarImage} />
                        ) : (
                            <Text style={s.heroAvatarInitials}>{getInitials(userName)}</Text>
                        )}
                    </View>
                    <View style={s.heroNameCol}>
                        <Text style={s.heroGreeting}>{getGreeting()}</Text>
                        <Text style={s.heroName} numberOfLines={1}>{userName}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.85} style={s.heroBtn} onPress={() => router.push('/(tabs)/Calendar')}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} style={s.heroBtn} onPress={() => router.push('/(tabs)/Notifications')}>
                        <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={s.heroBadge}>
                                <Text style={s.heroBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Stat cards ── */}
                <View style={s.statRow}>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={17} color="#F59E0B" />
                        </View>
                        <Text style={s.statNum}>{tasksLoaded ? (stats.pending ?? 0) : '–'}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>Pendientes</Text>
                    </View>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#E8F8FB' }]}>
                            <MaterialCommunityIcons name="progress-clock" size={17} color="#06B6D4" />
                        </View>
                        <Text style={s.statNum}>{tasksLoaded ? (stats.inProgress ?? 0) : '–'}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>En curso</Text>
                    </View>
                    <View style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: '#DCFCE7' }]}>
                            <MaterialCommunityIcons name="check-circle-outline" size={17} color="#22C55E" />
                        </View>
                        <Text style={s.statNum}>{tasksLoaded ? (stats.completed ?? 0) : '–'}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>Completadas</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Gráficas ── */}
            <View style={{ paddingTop: 24 }}>
                {!tasksLoaded || !incidentsLoaded ? (
                    <View style={{ paddingHorizontal: 20 }}>
                        <SkeletonChartCard shimmer={shimmer} />
                    </View>
                ) : (
                    <ChartCarousel
                        weeklyData={weeklyData}
                        incWeeklyData={incWeeklyData}
                        chartMax={chartMax}
                        incChartMax={incChartMax}
                        todayIndex={todayIndex}
                        barProgress={barProgress}
                        taskChartType={taskChartType}
                        setTaskChartType={setTaskChartType}
                        chartSlide={chartSlide}
                        setChartSlide={setChartSlide}
                        weekTotal={weekTotal}
                        incWeekTotal={incWeekTotal}
                    />
                )}
            </View>

            {/* ── Actividad reciente ── */}
            <ActivityFeed
                recentActivity={recentActivity}
                incidentsLoaded={incidentsLoaded}
                shimmer={shimmer}
                router={router}
            />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2FF' },
    content:   { paddingBottom: 48 },

    hero:         { paddingTop: 56, paddingBottom: 0, paddingHorizontal: 24 },
    heroDecoClip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
    heroDeco1:    { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroDeco2:    { position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    heroAvatar:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    heroAvatarImage:    { width: 64, height: 64, borderRadius: 32 },
    heroAvatarInitials: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
    heroNameCol:  { flex: 1, gap: 4 },
    heroGreeting: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
    heroName:     { color: '#ffffff', fontSize: 26, fontWeight: '800' },
    heroBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    heroBadge:    { position: 'absolute', top: 4, right: 4, backgroundColor: '#F43F5E', borderRadius: 999, minWidth: 14, height: 14, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center' },
    heroBadgeText:{ color: '#fff', fontSize: 8, fontWeight: '800' },

    statRow:  { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, height: 104, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#2D3FE0', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    statNum:  { color: '#1A1F36', fontSize: 22, fontWeight: '800' },
    statLabel:{ color: '#8F95B2', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
});
