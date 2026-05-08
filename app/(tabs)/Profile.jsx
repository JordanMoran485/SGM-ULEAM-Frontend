import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useAppContext } from '../../src/context/AppContext';

function getInitials(name) {
    if (!name) {
        return 'U';
    }

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function Profile() {
    const router = useRouter();
    const { user, stats, logout } = useAppContext();

    const displayName = [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.name || 'Usuario ULEAM';
    const userEmail = user?.email || 'Sin correo registrado';
    const userRole = user?.role || user?.cargo || 'Operador del sistema';
    const accountStatus = user?.active_state === false ? 'Cuenta desactivada' : 'Cuenta activa';
    const accountStatusTone = user?.active_state === false ? styles.statusAlert : styles.statusGood;
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const activeLoad = stats.pending + stats.inProgress;
    const careerLabel = user?.carrera?.name || (user?.carrera_id ? `Carrera #${user.carrera_id}` : 'No asignada');

    const handleLogout = () => {
        logout();
        router.replace('/Login');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen
                options={{
                    title: 'Mi Perfil',
                    headerLargeTitle: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#f3f6f4' },
                }}
            />

            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.eyebrow}>Cuenta y seguimiento</Text>
                    <Text style={styles.title}>{displayName}</Text>
                    <Text style={styles.subtitle}>
                        Revisa tu identidad dentro del sistema, tu carga actual y los accesos principales.
                    </Text>
                </View>

                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                </View>
            </View>

            <LinearGradient
                colors={['#0f2f29', '#1a4b41']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.heroTopRow}>
                    <View style={styles.heroIdentity}>
                        <Text style={styles.heroLabel}>Perfil institucional</Text>
                        <Text style={styles.heroValue}>{completionRate}%</Text>
                        <Text style={styles.heroHelper}>de tareas registradas ya completadas</Text>
                    </View>

                    <View style={styles.heroStatusCard}>
                        <Text style={styles.heroStatusKicker}>Carga activa</Text>
                        <Text style={styles.heroStatusValue}>{activeLoad}</Text>
                        <Text style={styles.heroStatusText}>pendientes y en progreso</Text>
                    </View>
                </View>

                <View style={styles.heroBottomRow}>
                    <TouchableOpacity
                        style={styles.heroActionPrimary}
                        onPress={() => router.push('/(tabs)/Dashboard')}
                    >
                        <Text style={styles.heroActionPrimaryText}>Ir al panel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.heroActionSecondary}
                        onPress={() => router.push('/(tabs)/Incidents')}
                    >
                        <Text style={styles.heroActionSecondaryText}>Ver incidencias</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, styles.metricCardNeutral]}>
                    <Text style={styles.metricLabel}>Reportes</Text>
                    <Text style={styles.metricValue}>{stats.total}</Text>
                </View>
                <View style={[styles.metricCard, styles.metricCardWarning]}>
                    <Text style={styles.metricLabel}>Pendientes</Text>
                    <Text style={styles.metricValue}>{stats.pending}</Text>
                </View>
                <View style={[styles.metricCard, styles.metricCardCool]}>
                    <Text style={styles.metricLabel}>Completadas</Text>
                    <Text style={styles.metricValue}>{stats.completed}</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Resumen de cuenta</Text>
            </View>

            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>Correo</Text>
                    </View>
                    <Text style={styles.infoValue}>{userEmail}</Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>Rol</Text>
                    </View>
                    <Text style={styles.infoValue}>{userRole}</Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoBadgeText}>Carrera</Text>
                    </View>
                    <Text style={styles.infoValue}>{careerLabel}</Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                    <View style={[styles.statusPill, accountStatusTone]}>
                        <Text style={[styles.statusPillText, user?.active_state === false ? styles.statusPillTextAlert : styles.statusPillTextGood]}>
                            {accountStatus}
                        </Text>
                    </View>
                    <Text style={styles.infoHint}>Estado actual de acceso en la plataforma</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            </View>

            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/Dashboard')}
            >
                <View>
                    <Text style={styles.actionTitle}>Volver al panel operativo</Text>
                    <Text style={styles.actionText}>
                        Consulta prioridades, actividad reciente y zonas con mayor carga.
                    </Text>
                </View>
                <Text style={styles.actionLink}>Abrir</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/Incidents')}
            >
                <View>
                    <Text style={styles.actionTitle}>Gestionar incidencias</Text>
                    <Text style={styles.actionText}>
                        Filtra tareas, revisa responsables y entra al detalle de cada caso.
                    </Text>
                </View>
                <Text style={styles.actionLink}>Abrir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.logoutCard]} onPress={handleLogout}>
                <View>
                    <Text style={styles.logoutTitle}>Cerrar sesión</Text>
                    <Text style={styles.logoutText}>
                        Finaliza la sesión actual en este dispositivo.
                    </Text>
                </View>
                <Text style={styles.logoutLink}>Salir</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>Sistema de Mantenimiento ULEAM</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f6f4',
    },
    content: {
        padding: 20,
        paddingBottom: 38,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerText: {
        flex: 1,
        paddingRight: 16,
    },
    eyebrow: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
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
    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#dbe5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#17342d',
        fontSize: 18,
        fontWeight: '800',
    },
    heroCard: {
        borderRadius: 30,
        padding: 22,
        marginBottom: 18,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 20,
    },
    heroIdentity: {
        flex: 1,
    },
    heroLabel: {
        color: '#9fd0c2',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    heroValue: {
        color: '#ffffff',
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 52,
    },
    heroHelper: {
        color: '#d7ebe5',
        fontSize: 14,
        marginTop: 4,
        lineHeight: 20,
    },
    heroStatusCard: {
        minWidth: 112,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    heroStatusKicker: {
        color: '#c3ddd6',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
    },
    heroStatusValue: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '800',
    },
    heroStatusText: {
        color: '#d7ebe5',
        fontSize: 12,
        marginTop: 4,
        lineHeight: 17,
    },
    heroBottomRow: {
        flexDirection: 'row',
        gap: 10,
    },
    heroActionPrimary: {
        flex: 1,
        backgroundColor: '#f3f6f4',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },
    heroActionPrimaryText: {
        color: '#10342d',
        fontSize: 14,
        fontWeight: '800',
    },
    heroActionSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },
    heroActionSecondaryText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        borderRadius: 22,
        padding: 16,
    },
    metricCardNeutral: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    metricCardWarning: {
        backgroundColor: '#f7efe3',
        borderWidth: 1,
        borderColor: '#ebdec5',
    },
    metricCardCool: {
        backgroundColor: '#eaf3f8',
        borderWidth: 1,
        borderColor: '#d3e4ef',
    },
    metricLabel: {
        color: '#687974',
        fontSize: 12,
        marginBottom: 8,
    },
    metricValue: {
        color: '#16211e',
        fontSize: 30,
        fontWeight: '800',
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#16211e',
        fontSize: 19,
        fontWeight: '800',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    infoBadge: {
        backgroundColor: '#edf4f1',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    infoBadgeText: {
        color: '#17342d',
        fontSize: 12,
        fontWeight: '800',
    },
    infoValue: {
        flex: 1,
        color: '#16211e',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'right',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#edf2ef',
        marginVertical: 14,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    statusGood: {
        backgroundColor: '#e5f4ec',
    },
    statusAlert: {
        backgroundColor: '#fdeceb',
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '800',
    },
    statusPillTextGood: {
        color: '#1b8659',
    },
    statusPillTextAlert: {
        color: '#b54745',
    },
    infoHint: {
        flex: 1,
        color: '#687974',
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'right',
    },
    actionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    actionTitle: {
        color: '#16211e',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    actionText: {
        color: '#687974',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: '92%',
    },
    actionLink: {
        color: '#10342d',
        fontSize: 13,
        fontWeight: '800',
    },
    logoutCard: {
        backgroundColor: '#fff6f5',
        borderColor: '#f2d8d5',
        marginTop: 6,
    },
    logoutTitle: {
        color: '#7f2926',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    logoutText: {
        color: '#99605d',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: '92%',
    },
    logoutLink: {
        color: '#c5453f',
        fontSize: 13,
        fontWeight: '800',
    },
    footerText: {
        textAlign: 'center',
        color: '#8a9894',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 18,
    },
});
