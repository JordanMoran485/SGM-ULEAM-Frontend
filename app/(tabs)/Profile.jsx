import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function Profile() {
    const router = useRouter();

    const user = {
        name: "Jordan Mendoza",
        role: "Conserje / Mantenimiento",
        email: "jordan.mendoza@live.uleam.edu.ec",
        avatar: "https://ui-avatars.com/api/?name=Jordan+Mendoza&background=0984E3&color=fff&size=128",
        reportsCount: 12,
        pendingCount: 3
    };

    const handleLogout = () => {
        console.log("Cerrando sesión...");
        router.replace('/login'); 
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Mi Perfil', headerShadowVisible: false }} />
            
            <View style={styles.header}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
            </View>

            {/* Estadístics Rápidas */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{user.reportsCount}</Text>
                    <Text style={styles.statLabel}>Reportes</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E1E8EE' }]}>
                    <Text style={styles.statNumber}>{user.pendingCount}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, {color: '#00b894'}]}>9</Text>
                    <Text style={styles.statLabel}>Listos</Text>
                </View>
            </View>

            {/* Opciones de Menú */}
            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>Ajustes de cuenta</Text>
                
                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>📧 {user.email}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>🔒 Cambiar Contraseña</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemText}>🔔 Notificaciones</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutBtn]} 
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>Uleam - Sistema de Mantenimiento v1.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#2D3436' },
    userRole: { fontSize: 14, color: '#636E72', marginTop: 5 },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        margin: 20,
        borderRadius: 15,
        padding: 20,
        elevation: 4,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#0984E3' },
    statLabel: { fontSize: 12, color: '#B2BEC3', marginTop: 5 },
    menuContainer: { paddingHorizontal: 20 },
    menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginBottom: 15 },
    menuItem: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: { fontSize: 15, color: '#2D3436' },
    logoutBtn: { marginTop: 20, backgroundColor: '#FFEBEB', justifyContent: 'center' },
    logoutText: { color: '#D63031', fontWeight: 'bold' },
    footerText: { textAlign: 'center', color: '#B2BEC3', fontSize: 12, marginVertical: 30 }
});