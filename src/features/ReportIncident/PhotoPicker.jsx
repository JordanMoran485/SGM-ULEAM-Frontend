import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function PhotoActions({ onTakePhoto, onPickFromLibrary, hasPhoto }) {
    return (
        <View style={s.photoActions}>
            <TouchableOpacity activeOpacity={0.85} style={[s.photoBtn, { overflow: 'hidden' }]} onPress={onTakePhoto}>
                <LinearGradient colors={['#2D3FE0', '#4A6CF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.photoBtnGradient}>
                    <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                    <Text style={s.photoBtnTextPrimary}>{hasPhoto ? 'Cambiar' : 'Tomar foto'}</Text>
                </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={s.photoBtnSecondary} onPress={onPickFromLibrary}>
                <MaterialCommunityIcons name="image-outline" size={16} color="#4A6CF7" />
                <Text style={s.photoBtnTextSecondary}>Galería</Text>
            </TouchableOpacity>
        </View>
    );
}

export function PhotoPicker({ photo, index, required, loading, error, onTakePhoto, onPickFromLibrary, onPreview }) {
    return (
        <View style={s.photoSection}>
            <Text style={s.fieldLabel}>
                {required
                    ? <>Foto de evidencia <Text style={{ color: '#F43F5E' }}>*</Text></>
                    : <>Segunda foto <Text style={{ color: '#8F95B2', fontWeight: '500' }}>(opcional)</Text></>
                }
            </Text>

            {photo ? (
                <TouchableOpacity activeOpacity={0.9} onPress={onPreview}>
                    <Image source={{ uri: photo.uri }} style={s.photoPreview} resizeMode="cover" />
                </TouchableOpacity>
            ) : required ? (
                <LinearGradient
                    colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[s.photoPlaceholder, error && s.photoPlaceholderError]}
                >
                    <View style={s.photoDecoDot} />
                    <View style={s.photoIconBox}>
                        <MaterialCommunityIcons
                            name={loading ? 'image-sync-outline' : 'camera-outline'}
                            size={32} color="rgba(255,255,255,0.9)"
                        />
                    </View>
                    <Text style={s.photoPlaceholderText}>
                        {loading ? 'Procesando foto...' : 'Sin evidencia adjunta'}
                    </Text>
                </LinearGradient>
            ) : loading ? (
                <View style={s.photoPlaceholderSecondary}>
                    <View style={s.photoIconBoxGhost}>
                        <MaterialCommunityIcons name="image-sync-outline" size={26} color="#4A6CF7" />
                    </View>
                    <Text style={s.photoPlaceholderSecondaryText}>Procesando foto...</Text>
                </View>
            ) : (
                <TouchableOpacity activeOpacity={0.85} style={s.photoPlaceholderSecondary} onPress={onTakePhoto}>
                    <View style={s.photoIconBoxGhost}>
                        <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#4A6CF7" />
                    </View>
                    <Text style={s.photoPlaceholderSecondaryText}>Agregar segunda foto</Text>
                </TouchableOpacity>
            )}

            {!!error && (
                <View style={s.errorRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#F43F5E" />
                    <Text style={s.errorText}>{error}</Text>
                </View>
            )}

            {(required || photo) && (
                <PhotoActions onTakePhoto={onTakePhoto} onPickFromLibrary={onPickFromLibrary} hasPhoto={!!photo} />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    photoSection:   { gap: 10, marginBottom: 4 },
    fieldLabel:     { color: '#8F95B2', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    photoPreview:   { width: '100%', height: 260, borderRadius: 16 },
    photoPlaceholder:{ height: 160, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoPlaceholderError:{ borderWidth: 1.5, borderColor: '#F43F5E' },
    photoDecoDot:   { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.10)' },
    photoIconBox:   { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    photoPlaceholderText:{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '600' },
    photoPlaceholderSecondary:{ height: 120, borderRadius: 16, borderWidth: 1.5, borderColor: '#C9D4FF', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F4F6FF' },
    photoIconBoxGhost:{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EDFF', alignItems: 'center', justifyContent: 'center' },
    photoPlaceholderSecondaryText:{ color: '#4A6CF7', fontSize: 13, fontWeight: '600' },
    photoActions:   { flexDirection: 'row', gap: 10 },
    photoBtn:       { flex: 1, borderRadius: 14 },
    photoBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14 },
    photoBtnTextPrimary:{ color: '#ffffff', fontSize: 14, fontWeight: '700' },
    photoBtnSecondary:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14, backgroundColor: '#E8EDFF', shadowColor: '#4A6CF7', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    photoBtnTextSecondary:{ color: '#4A6CF7', fontSize: 14, fontWeight: '700' },
    errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
    errorText:      { color: '#F43F5E', fontSize: 12, fontWeight: '600' },
});
