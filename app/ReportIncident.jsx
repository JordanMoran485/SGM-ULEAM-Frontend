import React from 'react';
import {
    Animated, Image, KeyboardAvoidingView, Modal, Platform,
    Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReportIncident } from '../src/features/ReportIncident/useReportIncident';
import { FieldInput } from '../src/features/ReportIncident/FieldInput';
import { PhotoPicker } from '../src/features/ReportIncident/PhotoPicker';
import { SpaceTypePicker } from '../src/features/ReportIncident/SpaceTypePicker';

export default function ReportIncidentScreen() {
    const router = useRouter();
    const {
        title, setTitle,
        location, setLocation,
        description, setDescription,
        photos, fullscreenIndex, setFullscreenIndex,
        loading, loadingPhoto,
        uploadProgress, progressAnim,
        errors, focused, setFocused,
        locationType, setLocationType,
        clearError,
        handleTakePhoto,
        handlePickFromLibrary, handleSubmit,
    } = useReportIncident();

    return (
        <>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    style={s.container}
                    contentContainerStyle={s.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Stack.Screen options={{ headerShown: false }} />

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
                        <Text style={s.heroEyebrow}>NUEVO REPORTE</Text>
                        <Text style={s.heroTitle}>Registrar incidencia</Text>
                    </LinearGradient>

                    <View style={s.card}>
                        <PhotoPicker
                            photo={photos[0]}
                            index={0}
                            required
                            loading={loadingPhoto === 0}
                            error={errors.photo}
                            onTakePhoto={() => handleTakePhoto(0)}
                            onPickFromLibrary={() => handlePickFromLibrary(0)}
                            onPreview={() => setFullscreenIndex(0)}
                        />

                        <View style={s.divider} />

                        <PhotoPicker
                            photo={photos[1]}
                            index={1}
                            required={false}
                            loading={loadingPhoto === 1}
                            onTakePhoto={() => handleTakePhoto(1)}
                            onPickFromLibrary={() => handlePickFromLibrary(1)}
                            onPreview={() => setFullscreenIndex(1)}
                        />

                        <View style={s.divider} />

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

                        <View style={s.divider} />

                        <SpaceTypePicker value={locationType} onChange={setLocationType} />

                        <View style={s.divider} />

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

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[s.submitBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitBtnGradient}>
                                <MaterialCommunityIcons name={loading ? 'loading' : 'send-outline'} size={loading ? 20 : 18} color="#fff" />
                                <Text style={s.submitBtnText}>{loading ? 'Enviando...' : 'Enviar incidencia'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {loading && (
                            <View style={s.progressContainer}>
                                <View style={s.progressTrack}>
                                    <Animated.View style={[s.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) }]} />
                                </View>
                                <Text style={s.progressText}>
                                    {uploadProgress < 100 ? `Subiendo evidencia... ${uploadProgress}%` : 'Procesando incidencia...'}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity activeOpacity={0.85} style={s.cancelBtn} onPress={() => router.back()}>
                            <Text style={s.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={fullscreenIndex !== null} transparent animationType="fade" statusBarTranslucent>
                <StatusBar hidden />
                <Pressable style={s.modalOverlay} onPress={() => setFullscreenIndex(null)}>
                    <Image source={{ uri: photos[fullscreenIndex]?.uri }} style={s.modalImage} resizeMode="contain" />
                    <View style={s.modalCloseBtn}>
                        <MaterialCommunityIcons name="close" size={20} color="#ffffff" />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    container:        { flex: 1, backgroundColor: '#EEF2FF' },
    content:          { paddingBottom: 48 },
    hero:             { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, overflow: 'hidden' },
    heroDeco1:        { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
    heroDeco2:        { position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' },
    backBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroEyebrow:      { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    heroTitle:        { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    card:             { backgroundColor: '#ffffff', borderRadius: 24, marginHorizontal: 20, marginTop: 20, padding: 20, shadowColor: '#4A6CF7', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    divider:          { height: 1, backgroundColor: '#F1F3FF', marginVertical: 20 },
    submitBtn:        { borderRadius: 20, overflow: 'hidden', marginTop: 8, shadowColor: '#2D3FE0', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    submitBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 16 },
    submitBtnText:    { color: '#ffffff', fontSize: 15, fontWeight: '700' },
    progressContainer:{ marginTop: 14, gap: 8 },
    progressTrack:    { height: 6, backgroundColor: '#E8EDFF', borderRadius: 999, overflow: 'hidden' },
    progressFill:     { height: '100%', backgroundColor: '#4A6CF7', borderRadius: 999 },
    progressText:     { color: '#8F95B2', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    cancelBtn:        { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
    cancelBtnText:    { color: '#8F95B2', fontSize: 14, fontWeight: '600' },
    modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
    modalImage:       { width: '100%', height: '100%' },
    modalCloseBtn:    { position: 'absolute', top: 52, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
});
