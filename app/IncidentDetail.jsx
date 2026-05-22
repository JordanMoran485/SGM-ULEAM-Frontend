import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppContext } from '../src/context/AppContext';

function getStatusTone(status) {
    if (status === 'completed') {
        return {
            badge: styles.badgeCompleted,
            badgeText: styles.badgeTextCompleted,
            panel: styles.imagePanelCompleted,
        };
    }

    if (status === 'in_progress') {
        return {
            badge: styles.badgeProgress,
            badgeText: styles.badgeTextProgress,
            panel: styles.imagePanelProgress,
        };
    }

    return {
        badge: styles.badgePending,
        badgeText: styles.badgeTextPending,
        panel: styles.imagePanelPending,
    };
}

export default function IncidentDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const {
        incidents,
        tasks,
        incidentsLoaded,
        tasksLoaded,
        refreshIncidents,
        refreshTasks,
        updateTaskState,
        user,
    } = useAppContext();
    const [imageFailed, setImageFailed] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const recordType = params.type === 'task' ? 'task' : 'incident';

    const incident = useMemo(() => {
        if (recordType === 'task') {
            return tasks.find((currentTask) => String(currentTask.id) === String(params.id))
                || incidents.find((currentIncident) => String(currentIncident.id) === String(params.id));
        }

        return incidents.find((currentIncident) => String(currentIncident.id) === String(params.id))
            || tasks.find((currentTask) => String(currentTask.id) === String(params.id));
    }, [incidents, params.id, recordType, tasks]);

    useEffect(() => {
        let isMounted = true;

        const recoverRecord = async () => {
            const needsTaskReload = recordType === 'task' && !incident;
            const needsIncidentReload = recordType === 'incident' && !incident;

            if (!needsTaskReload && !needsIncidentReload) {
                return;
            }

            if (!isMounted) {
                return;
            }

            setIsRecovering(true);

            try {
                if (recordType === 'task') {
                    await refreshTasks();
                    await refreshIncidents();
                } else {
                    await refreshIncidents();
                    await refreshTasks();
                }
            } finally {
                if (isMounted) {
                    setIsRecovering(false);
                }
            }
        };

        const shouldRecover =
            (recordType === 'task' && tasksLoaded && !incident) ||
            (recordType === 'incident' && incidentsLoaded && !incident);

        if (shouldRecover) {
            recoverRecord().catch((error) => {
                console.error('Error al recuperar detalle:', error);
                if (isMounted) {
                    setIsRecovering(false);
                }
            });
        }

        return () => {
            isMounted = false;
        };
    }, [incident, incidentsLoaded, recordType, refreshIncidents, refreshTasks, tasksLoaded]);

    const imageUri = incident?.image || incident?.latestTask?.image || incident?.tasks?.[0]?.image || null;
    const imageSource = imageUri && !imageFailed ? { uri: imageUri } : null;
    const statusTone = getStatusTone(incident?.status);
    const userRole = Array.isArray(user?.roles) ? user.roles[0]?.name : user?.role;
    const canUpdateTask = recordType === 'task' && userRole === 'conserje' && incident;

    const handleTaskStatusChange = async (nextStatus) => {
        if (!incident) {
            return;
        }

        setIsSubmitting(true);

        try {
            await updateTaskState(incident.id, nextStatus);
            await Promise.all([refreshTasks(), refreshIncidents()]);
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            Alert.alert('No se pudo actualizar', error?.message || 'No se pudo actualizar la tarea.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!incident && isRecovering) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0f2f29" />
                <Text style={styles.loadingText}>Actualizando la información de la tarea...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Stack.Screen options={{ title: 'Detalle del reporte', headerShown: false }} />

            <View style={styles.header}>
                <Text style={styles.eyebrow}>Seguimiento</Text>
                <Text style={styles.screenTitle}>{recordType === 'task' ? 'Detalle de tarea' : 'Detalle de incidencia'}</Text>
                <Text style={styles.subtitle}>
                    {recordType === 'task'
                        ? 'Revisa el estado, responsable, evidencia visual y programacion de la tarea.'
                        : 'Revisa el estado, responsable, evidencia visual y tareas asociadas desde una sola vista.'}
                </Text>
            </View>

            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.label}>Asunto del incidente</Text>
                        <Text style={styles.title}>{incident?.title || 'Incidencia no encontrada'}</Text>
                        <Text style={styles.heroMeta}>
                            {incident?.location || 'Sin ubicación'} · {incident?.assignedCleanerName || 'Sin asignar'}
                        </Text>
                    </View>

                    <View style={[styles.badge, statusTone.badge]}>
                        <Text style={[styles.statusText, statusTone.badgeText]}>
                            {incident?.statusLabel || 'Pendiente'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.imagePanel, statusTone.panel]}>
                    {imageSource ? (
                        <Image
                            source={imageSource}
                            style={styles.image}
                            resizeMode="cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <View style={styles.imageFallback}>
                            <Text style={styles.imageFallbackEyebrow}>Evidencia</Text>
                            <Text style={styles.imageFallbackTitle}>Sin foto disponible</Text>
                            <Text style={styles.imageFallbackText}>
                                El reporte todavía no tiene una imagen válida o accesible.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.label}>Descripción</Text>
                    <Text style={styles.infoText}>{incident?.description || 'Sin descripción registrada.'}</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Text style={styles.label}>Ubicación</Text>
                        <Text style={styles.infoCardText}>{incident?.location || 'Sin ubicación'}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.label}>Responsable</Text>
                        <Text style={styles.infoCardText}>{incident?.assignedCleanerName || 'Sin asignar'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Tareas asociadas</Text>
                    {incident?.tasks?.length ? (
                        incident.tasks.map((task) => (
                            <View key={String(task.id)} style={styles.taskCard}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <Text style={styles.taskMeta}>{task.statusLabel}</Text>
                                {task.assignedCleanerName ? (
                                    <Text style={styles.taskMeta}>Asignado a: {task.assignedCleanerName}</Text>
                                ) : null}
                                {task.description ? (
                                    <Text style={styles.taskDescription}>{task.description}</Text>
                                ) : null}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.infoText}>Esta incidencia todavía no tiene tareas enlazadas.</Text>
                    )}
                </View>

                {canUpdateTask ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>Acciones de la tarea</Text>

                        {incident.status !== 'in_progress' && incident.status !== 'completed' ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonSecondary]}
                                disabled={isSubmitting}
                                onPress={() => handleTaskStatusChange('in_progress')}
                            >
                                <Text style={styles.actionButtonSecondaryText}>
                                    {isSubmitting ? 'Actualizando...' : 'Marcar en progreso'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        {incident.status !== 'completed' ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonPrimary]}
                                disabled={isSubmitting}
                                onPress={() => handleTaskStatusChange('completed')}
                            >
                                <Text style={styles.actionButtonPrimaryText}>
                                    {isSubmitting ? 'Actualizando...' : 'Completar tarea'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : null}

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Volver a la lista</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f6f4',
        paddingHorizontal: 24,
    },
    loadingText: {
        color: '#4d5d58',
        fontSize: 15,
        marginTop: 14,
        textAlign: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#f3f6f4',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginTop: 54,
        marginBottom: 18,
    },
    eyebrow: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: 8,
    },
    screenTitle: {
        color: '#16211e',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#64746f',
        fontSize: 15,
        lineHeight: 22,
    },
    heroCard: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 16,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    heroTextBlock: {
        flex: 1,
    },
    label: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    title: {
        color: '#16211e',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    heroMeta: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 20,
    },
    badge: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    badgePending: {
        backgroundColor: '#f7efe3',
        borderColor: '#ebdec5',
    },
    badgeTextPending: {
        color: '#8a5a16',
    },
    badgeProgress: {
        backgroundColor: '#eaf3f8',
        borderColor: '#d3e4ef',
    },
    badgeTextProgress: {
        color: '#165b7a',
    },
    badgeCompleted: {
        backgroundColor: '#e5f3ea',
        borderColor: '#c9e6d3',
    },
    badgeTextCompleted: {
        color: '#21633d',
    },
    imagePanel: {
        minHeight: 240,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    imagePanelPending: {
        backgroundColor: '#fbf5eb',
        borderColor: '#ebdec5',
    },
    imagePanelProgress: {
        backgroundColor: '#eef5f9',
        borderColor: '#d3e4ef',
    },
    imagePanelCompleted: {
        backgroundColor: '#edf6f0',
        borderColor: '#c9e6d3',
    },
    image: {
        width: '100%',
        height: 240,
    },
    imageFallback: {
        minHeight: 240,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 22,
    },
    imageFallbackEyebrow: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    imageFallbackTitle: {
        color: '#16211e',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    imageFallbackText: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 21,
        maxWidth: 260,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    section: {
        marginBottom: 22,
    },
    infoText: {
        color: '#4d5d58',
        fontSize: 16,
        lineHeight: 24,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 22,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#f8faf9',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    infoCardText: {
        color: '#16211e',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },
    taskCard: {
        backgroundColor: '#f8faf9',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    taskTitle: {
        color: '#16211e',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    taskMeta: {
        color: '#4f6f65',
        fontSize: 13,
        marginBottom: 4,
    },
    taskDescription: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 20,
    },
    actionButton: {
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    actionButtonPrimary: {
        backgroundColor: '#10342d',
    },
    actionButtonPrimaryText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    actionButtonSecondary: {
        backgroundColor: '#eef5f2',
        borderWidth: 1,
        borderColor: '#cfe0d9',
    },
    actionButtonSecondaryText: {
        color: '#10342d',
        fontSize: 15,
        fontWeight: '700',
    },
    backButton: {
        backgroundColor: '#10342d',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 6,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
