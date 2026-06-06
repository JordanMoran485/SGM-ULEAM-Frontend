import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppContext } from '../src/context/AppContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatusConfig(status, approvalStatus) {
    if (approvalStatus === 'Rechazada')
        return { color: '#F43F5E', bg: '#FFE4E8', label: 'Rechazada', icon: 'close-circle-outline' };
    if (status === 'completed' || status === 'resolved')
        return { color: '#22C55E', bg: '#DCFCE7', label: 'Completada', icon: 'check-circle-outline' };
    if (status === 'in_progress')
        return { color: '#4A6CF7', bg: '#E8EDFF', label: 'En progreso', icon: 'progress-clock' };
    if (approvalStatus === 'Aceptada')
        return { color: '#06B6D4', bg: '#E8F8FB', label: 'Revisada', icon: 'clipboard-check-outline' };
    return { color: '#F59E0B', bg: '#FEF3C7', label: 'Pendiente', icon: 'clock-outline' };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Divider() {
    return <View style={{ height: 1, backgroundColor: '#F1F3FF', marginHorizontal: 16 }} />;
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={s.infoRow}>
            <View style={s.infoIconBox}>
                <MaterialCommunityIcons name={icon} size={18} color="#4A6CF7" />
            </View>
            <View style={s.infoBody}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function TaskRow({ task }) {
    const sc = getStatusConfig(task.status, null);
    return (
        <View style={s.taskRow}>
            <View style={[s.taskStripe, { backgroundColor: sc.color }]} />
            <View style={s.taskRowBody}>
                <View style={s.taskRowTop}>
                    <View style={[s.taskBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[s.taskBadgeText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                </View>
                <Text style={s.taskTitle}>{task.title}</Text>
                {task.assignedCleanerName ? (
                    <View style={s.taskMeta}>
                        <MaterialCommunityIcons name="account-outline" size={12} color="#8F95B2" />
                        <Text style={s.taskMetaText}>{task.assignedCleanerName}</Text>
                    </View>
                ) : null}
                {task.description ? (
                    <Text style={s.taskDesc} numberOfLines={2}>{task.description}</Text>
                ) : null}
            </View>
        </View>
    );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function IncidentDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { incidents, tasks, incidentsLoaded, tasksLoaded, refreshIncidents, refreshTasks, updateTaskState, user } = useAppContext();
    const [imageFailed, setImageFailed]   = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const recordType = params.type === 'task' ? 'task' : 'incident';

    const incident = useMemo(() => {
        if (recordType === 'task')
            return tasks.find((t) => String(t.id) === String(params.id))
                || incidents.find((i) => String(i.id) === String(params.id));
        return incidents.find((i) => String(i.id) === String(params.id))
            || tasks.find((t) => String(t.id) === String(params.id));
    }, [incidents, params.id, recordType, tasks]);

    useEffect(() => {
        let mounted = true;
        const needsReload =
            (recordType === 'task' && tasksLoaded && !incident) ||
            (recordType === 'incident' && incidentsLoaded && !incident);
        if (!needsReload) return;
        setIsRecovering(true);
        (recordType === 'task'
            ? Promise.all([refreshTasks(), refreshIncidents()])
            : Promise.all([refreshIncidents(), refreshTasks()])
        ).catch((e) => console.error('Error al recuperar detalle:', e))
         .finally(() => { if (mounted) setIsRecovering(false); });
        return () => { mounted = false; };
    }, [incident, incidentsLoaded, recordType, refreshIncidents, refreshTasks, tasksLoaded]);

    const handleTaskStatusChange = async (nextStatus) => {
        if (!incident) return;
        setIsSubmitting(true);
        try {
            await updateTaskState(incident.id, nextStatus);
            await Promise.all([refreshTasks(), refreshIncidents()]);
        } catch (e) {
            Alert.alert('No se pudo actualizar', e?.message || 'Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const imageUri    = incident?.image || incident?.latestTask?.image || incident?.tasks?.[0]?.image || null;
    const imageSource = imageUri && !imageFailed ? { uri: imageUri } : null;
    const sc          = getStatusConfig(incident?.status, incident?.approvalStatus);
    const userRole    = Array.isArray(user?.roles) ? user.roles[0]?.name : user?.role;
    const canUpdate   = recordType === 'task' && userRole === 'conserje' && incident;

    if (!incident && isRecovering) {
        return (
            <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color="#4A6CF7" />
                <Text style={s.loadingText}>Cargando información...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ title: '', headerShown: false }} />

            {/* ── Hero ── */}
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

                <Text style={s.heroEyebrow}>{recordType === 'task' ? 'TAREA' : 'INCIDENCIA'}</Text>
                <Text style={s.heroTitle} numberOfLines={3}>
                    {incident?.title || 'Sin título'}
                </Text>

                <View style={[s.statusBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                    <MaterialCommunityIcons name={sc.icon} size={13} color="#fff" />
                    <Text style={s.statusBadgeText}>{sc.label}</Text>
                </View>
            </LinearGradient>

            {/* ── Imagen (solo incidencias) ── */}
            {recordType === 'incident' && (
                <View style={s.imageCard}>
                    {imageSource ? (
                        <Image
                            source={imageSource}
                            style={s.image}
                            resizeMode="cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <View style={s.imageFallback}>
                            <LinearGradient
                                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={s.imageFallbackIcon}
                            >
                                <View style={s.imageFallbackDeco} />
                                <MaterialCommunityIcons name="image-off-outline" size={28} color="rgba(255,255,255,0.9)" />
                            </LinearGradient>
                            <Text style={s.imageFallbackTitle}>Sin evidencia visual</Text>
                            <Text style={s.imageFallbackSub}>No se adjuntó imagen a este reporte.</Text>
                        </View>
                    )}
                </View>
            )}

            {/* ── Info ── */}
            <View style={s.card}>
                <InfoRow icon="text-box-outline"  label="Descripción" value={incident?.description || 'Sin descripción registrada.'} />
                <Divider />
                <InfoRow icon="map-marker-outline" label="Ubicación"   value={incident?.location || 'Sin ubicación'} />
                <Divider />
                <InfoRow icon="account-outline"    label="Responsable" value={incident?.assignedCleanerName || 'Sin asignar'} />
                {(incident?.startAt || incident?.dueDate) && (
                    <>
                        <Divider />
                        <InfoRow
                            icon="calendar-outline"
                            label="Fecha programada"
                            value={new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                .format(new Date(incident.startAt || incident.dueDate))}
                        />
                    </>
                )}
            </View>

            {/* ── Tareas asociadas (incidencias) ── */}
            {recordType === 'incident' && (
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Tareas asociadas</Text>
                    {incident?.tasks?.length ? (
                        <View style={s.card}>
                            {incident.tasks.map((task, i) => (
                                <View key={String(task.id)}>
                                    <TaskRow task={task} />
                                    {i < incident.tasks.length - 1 && <Divider />}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={s.emptyCard}>
                            <LinearGradient
                                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={s.emptyIconBox}
                            >
                                <View style={s.emptyIconDeco} />
                                <MaterialCommunityIcons name="clipboard-text-off-outline" size={28} color="rgba(255,255,255,0.9)" />
                            </LinearGradient>
                            <Text style={s.emptyTitle}>Sin tareas enlazadas</Text>
                            <Text style={s.emptyBody}>Esta incidencia todavía no tiene tareas asociadas.</Text>
                        </View>
                    )}
                </View>
            )}

            {/* ── Acciones conserje ── */}
            {canUpdate && (
                <View style={s.actionsSection}>
                    {incident.status !== 'in_progress' && incident.status !== 'completed' && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={s.secondaryBtn}
                            disabled={isSubmitting}
                            onPress={() => handleTaskStatusChange('in_progress')}
                        >
                            <MaterialCommunityIcons name="progress-clock" size={18} color="#4A6CF7" />
                            <Text style={s.secondaryBtnText}>
                                {isSubmitting ? 'Actualizando...' : 'Marcar en progreso'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {incident.status !== 'completed' && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={s.primaryBtnWrap}
                            disabled={isSubmitting}
                            onPress={() => handleTaskStatusChange('completed')}
                        >
                            <LinearGradient
                                colors={['#2D3FE0', '#4A6CF7']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.primaryBtn}
                            >
                                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                                <Text style={s.primaryBtnText}>
                                    {isSubmitting ? 'Actualizando...' : 'Completar tarea'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2FF' },
    content:   { paddingBottom: 48 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', gap: 14 },
    loadingText: { color: '#8F95B2', fontSize: 14, fontWeight: '600' },

    // Hero
    hero: {
        paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, overflow: 'hidden',
    },
    heroDeco1: {
        position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroDeco2: {
        position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8,
    },
    heroTitle: {
        color: '#ffffff', fontSize: 26, fontWeight: '800', lineHeight: 32, marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
        borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    },
    statusBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

    // Image
    imageCard: {
        marginHorizontal: 20, marginTop: 20,
        backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    image: { width: '100%', height: 220 },
    imageFallback: {
        height: 180, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24,
    },
    imageFallbackIcon: {
        width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', marginBottom: 4,
        shadowColor: '#2D3FE0', shadowOpacity: 0.22, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    imageFallbackDeco: {
        position: 'absolute', top: -14, right: -14, width: 48, height: 48,
        borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)',
    },
    imageFallbackTitle: { color: '#1A1F36', fontSize: 15, fontWeight: '800' },
    imageFallbackSub:   { color: '#8F95B2', fontSize: 13, textAlign: 'center' },

    // Info card
    card: {
        marginHorizontal: 20, marginTop: 16, backgroundColor: '#ffffff', borderRadius: 20,
        paddingVertical: 6,
        shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16,
        paddingVertical: 14, gap: 14,
    },
    infoIconBox: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8EDFF',
        alignItems: 'center', justifyContent: 'center', marginTop: 1,
    },
    infoBody: { flex: 1, gap: 3 },
    infoLabel: {
        color: '#8F95B2', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.6,
    },
    infoValue: { color: '#1A1F36', fontSize: 14, fontWeight: '600', lineHeight: 20 },

    // Section
    section:      { marginTop: 24, paddingHorizontal: 20 },
    sectionTitle: { color: '#1A1F36', fontSize: 17, fontWeight: '700', marginBottom: 12 },

    // Task rows
    taskRow: {
        flexDirection: 'row', overflow: 'hidden',
    },
    taskStripe:  { width: 4 },
    taskRowBody: { flex: 1, padding: 14, gap: 6 },
    taskRowTop:  { flexDirection: 'row' },
    taskBadge:   { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    taskBadgeText: { fontSize: 11, fontWeight: '700' },
    taskTitle:   { color: '#1A1F36', fontSize: 14, fontWeight: '800' },
    taskMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
    taskMetaText:{ color: '#8F95B2', fontSize: 12, fontWeight: '500' },
    taskDesc:    { color: '#8F95B2', fontSize: 13, lineHeight: 18 },

    // Empty state
    emptyCard: {
        backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 36,
        paddingHorizontal: 24, alignItems: 'center', gap: 10,
        shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4,
        shadowColor: '#2D3FE0', shadowOpacity: 0.22, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    emptyIconDeco: {
        position: 'absolute', top: -14, right: -14, width: 48, height: 48,
        borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)',
    },
    emptyTitle: { color: '#1A1F36', fontSize: 15, fontWeight: '800', textAlign: 'center' },
    emptyBody:  { color: '#8F95B2', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 240 },

    // Actions
    actionsSection: { paddingHorizontal: 20, marginTop: 24, gap: 10 },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 15,
        shadowColor: '#4A6CF7', shadowOpacity: 0.09, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    secondaryBtnText: { color: '#4A6CF7', fontSize: 15, fontWeight: '700' },
    primaryBtnWrap:   { borderRadius: 20, overflow: 'hidden' },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16,
    },
    primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
