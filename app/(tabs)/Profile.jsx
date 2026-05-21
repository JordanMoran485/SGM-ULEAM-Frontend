import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const userRole =
        ({
            super_admin: 'Superadministrador',
            supervisor: 'Supervisor',
            conserje: 'Conserje',
        }[primaryRole || user?.role || user?.cargo] || user?.role || user?.cargo || 'Operador del sistema');
    const accountStatus = user?.active_state === false ? 'Cuenta desactivada' : 'Cuenta activa';
    const accountStatusTone = user?.active_state === false ? styles.statusAlert : styles.statusGood;
    const facultyLabel = user?.facultad?.name || (user?.facultad_id ? `Facultad #${user.facultad_id}` : 'No asignada');
    const remoteProfileImage = useMemo(() => {
        if (!user?.profile_photo_url) {
            return null;
        }

        const separator = user.profile_photo_url.includes('?') ? '&' : '?';
        return `${user.profile_photo_url}${separator}v=${avatarRefreshKey}`;
    }, [avatarRefreshKey, user?.profile_photo_url]);

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
                setAvatarRefreshKey((current) => current + 1);
            }
        } catch (error) {
            Alert.alert('No se pudo actualizar la foto', error?.message || 'Intenta nuevamente.');
        }
    };

    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                Alert.alert('Permiso requerido', 'Debes permitir el acceso a la camara para tomar la foto.');
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
                setAvatarRefreshKey((current) => current + 1);
            }
        } catch (error) {
            Alert.alert('No se pudo actualizar la foto', error?.message || 'Intenta nuevamente.');
        }
    };

    const handlePickProfileImage = () => {
        Alert.alert('Foto de perfil', 'Elige una opcion', [
            { text: 'Tomar foto', onPress: takePhoto },
            { text: 'Galeria', onPress: pickFromLibrary },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

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
                        Revisa tu identidad dentro del sistema, tu carga actual y el estado de tu cuenta.
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.avatarSection} onPress={handlePickProfileImage} activeOpacity={0.9}>
                <View style={styles.avatarEditorFrame}>
                    {localProfilePreview || remoteProfileImage ? (
                        <Image
                            key={localProfilePreview || remoteProfileImage}
                            source={{ uri: localProfilePreview || remoteProfileImage }}
                            style={styles.avatarEditorImage}
                            onError={() => {
                                if (localProfilePreview && remoteProfileImage) {
                                    setLocalProfilePreview(null);
                                    return;
                                }

                                Alert.alert('No se pudo mostrar la foto', 'La imagen se guardó, pero no se pudo cargar en la app.');
                            }}
                        />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <MaterialCommunityIcons name="account-circle" size={88} color="#c6d6d0" />
                        </View>
                    )}

                    <View style={styles.avatarEditBadge}>
                        <MaterialCommunityIcons name="pencil" size={16} color="#10342d" />
                    </View>
                </View>

                <Text style={styles.avatarCardTitle}>Foto de perfil</Text>
                <Text style={styles.avatarCardText}>Toca para tomar una foto o elegir una imagen.</Text>
            </TouchableOpacity>

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
                        <Text style={styles.infoBadgeText}>Facultad</Text>
                    </View>
                    <Text style={styles.infoValue}>{facultyLabel}</Text>
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

            <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.9}>
                <View style={styles.logoutContent}>
                    <View style={styles.logoutIconWrap}>
                        <MaterialCommunityIcons name="logout-variant" size={20} color="#b93832" />
                    </View>
                    <Text style={styles.logoutTitle}>Cerrar sesion</Text>
                </View>
                <View style={styles.logoutCta}>
                    <Text style={styles.logoutLink}>Salir</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#ffffff" />
                </View>
            </TouchableOpacity>

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
    avatarSection: {
        paddingVertical: 8,
        alignItems: 'center',
        marginBottom: 18,
    },
    avatarEditorFrame: {
        width: 124,
        height: 124,
        borderRadius: 62,
        backgroundColor: '#edf4f1',
        borderWidth: 1,
        borderColor: '#d9e5e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        position: 'relative',
        overflow: 'visible',
    },
    avatarEditorImage: {
        width: '100%',
        height: '100%',
        borderRadius: 62,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        borderRadius: 62,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#edf4f1',
    },
    avatarEditBadge: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f6f4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    avatarCardTitle: {
        color: '#16211e',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    avatarCardText: {
        color: '#64746f',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
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
    logoutCard: {
        backgroundColor: '#fff4f2',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#efcfca',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        shadowColor: '#d06d65',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    logoutIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#ffe2de',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutTitle: {
        color: '#7f2926',
        fontSize: 16,
        fontWeight: '800',
    },
    logoutCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#c5453f',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    logoutLink: {
        color: '#ffffff',
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
