import React, { useState } from 'react';
import {
    Alert, Image, Modal, Pressable, ScrollView, StatusBar,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createIncident } from '../src/services/incidents';
import { useAppContext } from '../src/context/AppContext';

function normalizePickedAsset(asset) {
    if (!asset?.uri) return null;
    return {
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split('/').pop() || 'incident-photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
    };
}

const LOCATION_TYPES = [
    { key: 'bathroom',  label: 'Baño',       icon: 'toilet' },
    { key: 'classroom', label: 'Aula',       icon: 'school-outline' },
    { key: 'hallway',   label: 'Pasillo',    icon: 'door-open' },
    { key: 'exterior',  label: 'Exteriores', icon: 'tree-outline' },
    { key: 'stairs',    label: 'Escaleras',  icon: 'stairs' },
];

function FieldInput({ label, value, onChangeText, placeholder, multiline, error, focused, onFocus, onBlur }) {
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.inputMultiline,
                    focused && styles.inputFocused,
                    error && styles.inputError,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#C4C9E2"
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {!!error && (
                <View style={styles.errorRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#F43F5E" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

export default function ReportIncidentScreen() {
    const router = useRouter();
    const { token, refreshIncidents } = useAppContext();

    const [title, setTitle]           = useState('');
    const [location, setLocation]     = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto]           = useState(null);
    const [photoFullscreen, setPhotoFullscreen] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [errors, setErrors]         = useState({});
    const [focused, setFocused]       = useState('');
    const [locationType, setLocationType] = useState(null);

    const clearError = (field) => setErrors((e) => ({ ...e, [field]: undefined }));

    const validate = () => {
        const next = {};
        if (!title.trim())                     next.title       = 'El asunto es obligatorio.';
        if (!location.trim() && !locationType) next.location   = 'La ubicación es obligatoria.';
        if (!description.trim())               next.description = 'La descripción es obligatoria.';
        if (!photo)                            next.photo       = 'Debes adjuntar una foto de la incidencia.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleTakePhoto = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permiso requerido', 'Debes permitir el acceso a la cámara.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], quality: 0.75,
        });
        if (!result.canceled && result.assets?.[0]) {
            setPhoto(normalizePickedAsset(result.assets[0]));
            clearError('photo');
        }
    };

    const handlePickFromLibrary = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permiso requerido', 'Debes permitir el acceso a tus fotos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], quality: 0.75,
        });
        if (!result.canceled && result.assets?.[0]) {
            setPhoto(normalizePickedAsset(result.assets[0]));
            clearError('photo');
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const locationLabel = LOCATION_TYPES.find((lt) => lt.key === locationType)?.label;
            const locationFull  = [locationLabel, location.trim() || null].filter(Boolean).join(' - ');

            await createIncident(token, {
                title: title.trim(),
                location: locationFull,
                description: description.trim(),
                image: photo,
            });
            await refreshIncidents();
            Alert.alert('Incidencia reportada', 'La incidencia fue enviada correctamente.');
            router.replace('/(tabs)/Incidents');
        } catch (error) {
            Alert.alert('No se pudo reportar', error?.message || 'El servidor rechazó la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Hero ── */}
            <LinearGradient
                colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.heroDeco1} />
                <View style={styles.heroDeco2} />

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.heroEyebrow}>NUEVO REPORTE</Text>
                <Text style={styles.heroTitle}>Registrar incidencia</Text>
            </LinearGradient>

            {/* ── Formulario ── */}
            <View style={styles.card}>

                {/* Foto */}
                <View style={styles.photoSection}>
                    <Text style={styles.fieldLabel}>Foto de evidencia</Text>

                    {photo ? (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setPhotoFullscreen(true)}>
                            <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
                        </TouchableOpacity>
                    ) : (
                        <LinearGradient
                            colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[styles.photoPlaceholder, errors.photo && styles.photoPlaceholderError]}
                        >
                            <View style={styles.photoDecoDot} />
                            <View style={styles.photoIconBox}>
                                <MaterialCommunityIcons name="camera-outline" size={32} color="rgba(255,255,255,0.9)" />
                            </View>
                            <Text style={styles.photoPlaceholderText}>Sin evidencia adjunta</Text>
                        </LinearGradient>
                    )}

                    {!!errors.photo && (
                        <View style={styles.errorRow}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#F43F5E" />
                            <Text style={styles.errorText}>{errors.photo}</Text>
                        </View>
                    )}

                    <View style={styles.photoActions}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[styles.photoBtn, { overflow: 'hidden' }]}
                            onPress={handleTakePhoto}
                        >
                            <LinearGradient
                                colors={['#2D3FE0', '#4A6CF7']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.photoBtnGradient}
                            >
                                <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                                <Text style={styles.photoBtnTextPrimary}>
                                    {photo ? 'Tomar otra' : 'Tomar foto'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.photoBtnSecondary}
                            onPress={handlePickFromLibrary}
                        >
                            <MaterialCommunityIcons name="image-outline" size={16} color="#4A6CF7" />
                            <Text style={styles.photoBtnTextSecondary}>Galería</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Campos */}
                <FieldInput
                    label="Asunto"
                    value={title}
                    onChangeText={(v) => { setTitle(v); clearError('title'); }}
                    placeholder="Ej. Fuga de agua en baño"
                    error={errors.title}
                    focused={focused === 'title'}
                    onFocus={() => setFocused('title')}
                    onBlur={() => setFocused('')}
                />

                <FieldInput
                    label="Ubicación"
                    value={location}
                    onChangeText={(v) => { setLocation(v); clearError('location'); }}
                    placeholder="Ej. Edificio A, piso 2"
                    error={errors.location}
                    focused={focused === 'location'}
                    onFocus={() => setFocused('location')}
                    onBlur={() => setFocused('')}
                />

                <View style={styles.divider} />

                {/* ── Tipo de espacio ── */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockLabel}>Tipo de espacio</Text>
                    <View style={styles.locationGrid}>
                        {LOCATION_TYPES.map((lt) => {
                            const active = locationType === lt.key;
                            return (
                                <TouchableOpacity
                                    key={lt.key}
                                    activeOpacity={0.85}
                                    style={styles.locationItem}
                                    onPress={() => setLocationType(active ? null : lt.key)}
                                >
                                    <View style={[styles.locationIconBox, active && styles.locationIconBoxActive]}>
                                        <MaterialCommunityIcons
                                            name={lt.icon}
                                            size={28}
                                            color={active ? '#2D3FE0' : '#8F95B2'}
                                        />
                                    </View>
                                    <Text style={[styles.locationLabel, active && styles.locationLabelActive]}>
                                        {lt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.divider} />

                <FieldInput
                    label="Descripción"
                    value={description}
                    onChangeText={(v) => { setDescription(v); clearError('description'); }}
                    placeholder="Describe el problema con el mayor detalle posible..."
                    multiline
                    error={errors.description}
                    focused={focused === 'description'}
                    onFocus={() => setFocused('description')}
                    onBlur={() => setFocused('')}
                />

                {/* Botón enviar */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#2D3FE0', '#4A6CF7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.submitBtnGradient}
                    >
                        {loading
                            ? <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                            : <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
                        }
                        <Text style={styles.submitBtnText}>
                            {loading ? 'Enviando...' : 'Enviar incidencia'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.cancelBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>

        {/* ── Modal imagen completa ── */}

        <Modal visible={photoFullscreen} transparent animationType="fade" statusBarTranslucent>
            <StatusBar hidden />
            <Pressable style={styles.modalOverlay} onPress={() => setPhotoFullscreen(false)}>
                <Image
                    source={{ uri: photo?.uri }}
                    style={styles.modalImage}
                    resizeMode="contain"
                />
                <View style={styles.modalCloseBtn}>
                    <MaterialCommunityIcons name="close" size={20} color="#ffffff" />
                </View>
            </Pressable>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2FF' },
    content:   { paddingBottom: 48 },

    // Hero
    hero: {
        paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24,
        overflow: 'hidden',
    },
    heroDeco1: {
        position: 'absolute', top: -50, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroDeco2: {
        position: 'absolute', bottom: -20, left: -30,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6,
    },
    heroTitle: {
        color: '#ffffff', fontSize: 28, fontWeight: '800',
    },

    // Card principal
    card: {
        backgroundColor: '#ffffff', borderRadius: 24,
        marginHorizontal: 20, marginTop: 20,
        padding: 20,
        shadowColor: '#4A6CF7', shadowOpacity: 0.10,
        shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },

    // Foto
    photoSection: { gap: 10, marginBottom: 4 },
    photoPreview: { width: '100%', height: 260, borderRadius: 16 },
    photoPlaceholder: {
        height: 160, borderRadius: 16, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    photoPlaceholderError: { borderWidth: 1.5, borderColor: '#F43F5E' },
    photoDecoDot: {
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    photoIconBox: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    photoPlaceholderText: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '600' },
    photoActions: { flexDirection: 'row', gap: 10 },
    photoBtn: { flex: 1, borderRadius: 14 },
    photoBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 7, paddingVertical: 13, borderRadius: 14,
    },
    photoBtnTextPrimary: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    photoBtnSecondary: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 7, paddingVertical: 13, borderRadius: 14,
        backgroundColor: '#E8EDFF',
        shadowColor: '#4A6CF7', shadowOpacity: 0.08,
        shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    photoBtnTextSecondary: { color: '#4A6CF7', fontSize: 14, fontWeight: '700' },

    divider: { height: 1, backgroundColor: '#F1F3FF', marginVertical: 20 },

    // Inputs
    fieldWrap: { marginBottom: 16, gap: 6 },
    fieldLabel: {
        color: '#8F95B2', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.6,
    },
    input: {
        backgroundColor: '#F8F9FF', borderRadius: 14,
        borderWidth: 1.5, borderColor: '#E8EDFF',
        paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15, color: '#1A1F36', fontWeight: '500',
    },
    inputMultiline: {
        minHeight: 120, paddingTop: 13,
    },
    inputFocused: {
        borderColor: '#4A6CF7',
        backgroundColor: '#ffffff',
    },
    inputError: {
        borderColor: '#F43F5E',
    },
    errorRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    errorText: {
        color: '#F43F5E', fontSize: 12, fontWeight: '600',
    },

    // Botón enviar
    submitBtn: {
        borderRadius: 20, overflow: 'hidden', marginTop: 8,
        shadowColor: '#2D3FE0', shadowOpacity: 0.25,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    submitBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 9, paddingVertical: 16,
    },
    submitBtnText: {
        color: '#ffffff', fontSize: 15, fontWeight: '700',
    },

    // Cancelar
    cancelBtn: {
        alignItems: 'center', paddingVertical: 14, marginTop: 4,
    },
    cancelBtnText: {
        color: '#8F95B2', fontSize: 14, fontWeight: '600',
    },

    // Tipo de espacio
    sectionBlock: { gap: 16, marginBottom: 4 },
    sectionBlockLabel: {
        color: '#8F95B2', fontSize: 10, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    locationGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    },
    locationItem: {
        width: '45%', alignItems: 'center', gap: 10,
    },
    locationIconBox: {
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: '#F1F3FF',
        alignItems: 'center', justifyContent: 'center',
    },
    locationIconBoxActive: {
        backgroundColor: '#E8EDFF',
    },
    locationLabel: {
        color: '#8F95B2', fontSize: 13, fontWeight: '500',
    },
    locationLabelActive: {
        color: '#2D3FE0', fontWeight: '700',
    },

    // Modal imagen completa
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 52,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.20)',
        alignItems: 'center',
        justifyContent: 'center',
    },

});
