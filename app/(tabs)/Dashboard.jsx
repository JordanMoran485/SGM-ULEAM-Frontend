import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Dashboard() {
    const router = useRouter();

    const stats = {
        pending: 5,
        in_progress: 2,
        completed: 18
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ 
                title: 'Panel de Control', 
                headerLargeTitle: true,
                headerStyle: { backgroundColor: '#F5F7FA' } 
            }} />

            <View style={styles.welcomeSection}>
                <Text style={styles.greeting}>Hola, {router.user?.name || 'Usuario'} 👋</Text>
                <Text style={styles.subGreeting}>Esto es lo que sucede hoy en la Uleam.</Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#FFEBEB' }]}>
                    <Text style={[styles.statNumber, { color: '#D63031' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.statNumber, { color: '#0984E3' }]}>{stats.in_progress}</Text>
                    <Text style={styles.statLabel}>En Curso</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.quickActions}>
                <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => router.push('/CreateIncident')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#00b894' }]}>
                        <Text style={styles.iconText}>+</Text>
                    </View>
                    <Text style={styles.actionLabel}>Reportar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => router.push('/Incidents')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#0984E3' }]}>
                        <Text style={styles.iconText}>📋</Text>
                    </View>
                    <Text style={styles.actionLabel}>Mis Tareas</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => router.push('/Profile')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#6c5ce7' }]}>
                        <Text style={styles.iconText}>👤</Text>
                    </View>
                    <Text style={styles.actionLabel}>Perfil</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Actividad Reciente</Text>
                    <TouchableOpacity onPress={() => router.push('/Incidents')}>
                        <Text style={styles.seeAll}>Ver todo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recentCard}>
                    <View style={styles.indicator} />
                    <View>
                        <Text style={styles.recentTitle}>Fuga de agua - Baños J2</Text>
                        <Text style={styles.recentTime}>Hace 15 minutos</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
    welcomeSection: { marginBottom: 25, marginTop: 10 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: '#2D3436' },
    subGreeting: { fontSize: 16, color: '#636E72', marginTop: 5 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    statCard: { width: (width - 60) / 2, padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
    statNumber: { fontSize: 32, fontWeight: 'bold' },
    statLabel: { fontSize: 14, fontWeight: '600', marginTop: 5, color: '#2D3436' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 15 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    actionBtn: { alignItems: 'center' },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3 },
    iconText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    actionLabel: { fontSize: 12, fontWeight: 'bold', color: '#636E72' },
    recentSection: { marginBottom: 40 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAll: { color: '#0984E3', fontWeight: 'bold' },
    recentCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    indicator: { width: 4, height: 40, backgroundColor: '#D63031', borderRadius: 2, marginRight: 15 },
    recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3436' },
    recentTime: { fontSize: 12, color: '#B2BEC3', marginTop: 3 }
});