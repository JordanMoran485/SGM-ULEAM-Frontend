import React, { useMemo, useState } from 'react';
import {
    Alert, Image, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../../src/context/AppContext';

export default function Profile() {
    const router = useRouter();
    const { user, logout, updateProfileImage } = useAppContext();
    const [localProfilePreview, setLocalProfilePreview] = useState(null);
    const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

    const displayName = [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.name || 'Usuario ULEAM';
    const userEmail = user?.email || 'Sin correo registrado';
    const primaryRole = Array.isArray(user?.roles) ? user.roles[0]?.name : null;
    const userRole = ({
        super_admin: 'Superadministrador',
        supervisor: 'Supervisor',
        conserje: 'Conserje',
    }[primaryRole || user?.role || user?.cargo] || user?.role || user?.cargo || 'Operador del sistema');
    const isActive = user?.active_state !== false;
    const facultyLabel = user?.facultad?.display_name || user?.facultad?.name
        || (user?.facultad_id ? `Facultad #${user.facultad_id}` : 'No asignada');

    const remoteProfileImage = useMemo(() => {
        if (!user?.profile_photo_url) return null;
        const sep = user.profile_photo_url.includes('?') ? '&' : '?';
        return `${user.profile_photo_url}${sep}v=${avatarRefreshKey}`;
    }, [avatarRefreshKey, user?.profile_photo_url]);

    const avatarUri = localProfilePreview || remoteProfileImage;

    const pickFromLibrary = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permiso requerido', 'Debes permitir el acceso a tus fotos para cambiar el avatar.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
                setLocalProfilePreview(result.assets[0].uri);
                await updateProfileImage(result.assets[0]);
                setAvatarRefreshKey((k) => k + 1);
            }
        } catch (error) {
            Alert.alert('No se pudo actualizar la foto', error?.message || 'Intenta nuevamente.');
        }
    };

    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permiso requerido', 'Debes permitir el acceso a la cámara para tomar la foto.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
                setLocalProfilePreview(result.assets[0].uri);
                await updateProfileImage(result.assets[0]);
                setAvatarRefreshKey((k) => k + 1);
            }
        } catch (error) {
            Alert.alert('No se pudo actualizar la foto', error?.message || 'Intenta nuevamente.');
        }
    };

    const handlePickProfileImage = () => {
        Alert.alert('Foto de perfil', 'Elige una opción', [
            { text: 'Tomar foto', onPress: takePhoto },
            { text: 'Galería', onPress: pickFromLibrary },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

    const handleLogout = () => {
        logout();
        router.replace('/Login');
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Stack.Screen options={{ title: '', headerTransparent: true, headerShadowVisible: false }} />

            {/* ── Hero card ── */}
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.decCircle1} />
                <View style={styles.decCircle2} />

                <TouchableOpacity onPress={handlePickProfileImage} activeOpacity={0.85} style={styles.avatarWrapper}>
                    <View style={styles.avatarRing}>
                        {avatarUri ? (
                            <Image
                                key={avatarUri}
                                source={{ uri: avatarUri }}
                                style={styles.avatarImage}
                                onError={() => localProfilePreview && setLocalProfilePreview(null)}
                            />
                        ) : (
                            <MaterialCommunityIcons name="account" size={52} color="#4A6CF7" />
                        )}
                    </View>
                    <View style={styles.avatarEditBadge}>
                        <MaterialCommunityIcons name="camera" size={13} color="#4A6CF7" />
                    </View>
                </TouchableOpacity>

                <Text style={styles.heroName}>{displayName}</Text>

                <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>{userRole}</Text>
                </View>

                <View style={styles.heroStatusRow}>
                    <View style={[styles.statusDot, isActive ? styles.dotGreen : styles.dotRed]} />
                    <Text style={styles.heroStatusText}>
                        {isActive ? 'Cuenta activa' : 'Cuenta desactivada'}
                    </Text>
                </View>
            </LinearGradient>

            {/* ── Mi información ── */}
            <Text style={styles.sectionLabel}>Mi información</Text>

            <View style={styles.card}>
                <View style={styles.listRow}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="email-outline" size={18} color="#4A6CF7" />
                    </View>
                    <View style={styles.listContent}>
                        <Text style={styles.listLabel}>Correo electrónico</Text>
                        <Text style={styles.listValue}>{userEmail}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.listRow}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="school-outline" size={18} color="#4A6CF7" />
                    </View>
                    <View style={styles.listContent}>
                        <Text style={styles.listLabel}>Facultad</Text>
                        <Text style={styles.listValue}>{facultyLabel}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.listRow}>
                    <View style={[styles.iconBox, isActive ? styles.iconBoxGreen : styles.iconBoxRed]}>
                        <MaterialCommunityIcons
                            name={isActive ? 'shield-check-outline' : 'shield-off-outline'}
                            size={18}
                            color={isActive ? '#22C55E' : '#F43F5E'}
                        />
                    </View>
                    <View style={styles.listContent}>
                        <Text style={styles.listLabel}>Estado de cuenta</Text>
                        <View style={[styles.statusBadge, isActive ? styles.badgeGreen : styles.badgeRed]}>
                            <Text style={[styles.statusBadgeText, isActive ? styles.badgeTextGreen : styles.badgeTextRed]}>
                                {isActive ? 'Activa' : 'Desactivada'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── Ajustes ── */}
            <Text style={styles.sectionLabel}>Ajustes</Text>

            <TouchableOpacity style={styles.card} onPress={handlePickProfileImage} activeOpacity={0.85}>
                <View style={styles.listRow}>
                    <View style={[styles.iconBox, styles.iconBoxCyan]}>
                        <MaterialCommunityIcons name="camera-outline" size={18} color="#22D3EE" />
                    </View>
                    <View style={styles.listContent}>
                        <Text style={styles.listLabel}>Foto de perfil</Text>
                        <Text style={styles.listValue}>Toca para cambiar tu foto</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#8F95B2" />
                </View>
            </TouchableOpacity>

            {/* ── Cerrar sesión ── */}
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={styles.logoutWrapper}>
                <LinearGradient
                    colors={['#F43F5E', '#FB7185']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.logoutBtn}
                >
                    <MaterialCommunityIcons name="logout-variant" size={18} color="#fff" />
                    <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
                </LinearGradient>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEF2FF',
    },
    content: {
        padding: 20,
        paddingTop: 64,
        paddingBottom: 40,
    },

    // Hero
    heroCard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginBottom: 28,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#2D3FE0',
        shadowOpacity: 0.28,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    decCircle1: {
        position: 'absolute',
        top: -32,
        right: -32,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    decCircle2: {
        position: 'absolute',
        bottom: -24,
        right: -16,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarRing: {
        width: 104,
        height: 104,
        borderRadius: 52,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    avatarImage: {
        width: 104,
        height: 104,
        borderRadius: 52,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2D3FE0',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    heroName: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 12,
    },
    heroBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    heroStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    dotGreen: { backgroundColor: '#22C55E' },
    dotRed:   { backgroundColor: '#F43F5E' },
    heroStatusText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontWeight: '600',
    },

    // Section
    sectionLabel: {
        color: '#8F95B2',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 4,
    },

    // Card
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingVertical: 6,
        marginBottom: 20,
        shadowColor: '#4A6CF7',
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },

    // List row
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E8EDFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxGreen: { backgroundColor: '#F0FDF4' },
    iconBoxRed:   { backgroundColor: '#FFF1F2' },
    iconBoxCyan:  { backgroundColor: '#E8F8FB' },
    listContent: {
        flex: 1,
        gap: 3,
    },
    listLabel: {
        color: '#8F95B2',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    listValue: {
        color: '#1A1F36',
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F3FF',
        marginHorizontal: 16,
    },

    // Status badge
    statusBadge: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 2,
    },
    badgeGreen: { backgroundColor: '#F0FDF4' },
    badgeRed:   { backgroundColor: '#FFF1F2' },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    badgeTextGreen: { color: '#22C55E' },
    badgeTextRed:   { color: '#F43F5E' },

    // Logout
    logoutWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 4,
        shadowColor: '#F43F5E',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    logoutBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
});
