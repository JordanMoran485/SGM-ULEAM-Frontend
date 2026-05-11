import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { createIncident } from '../src/services/incidents';
import { useAppContext } from '../src/context/AppContext';

const customTheme = {
    colors: {
        primary: '#0f2f29',
        outline: '#cad7d2',
        onSurfaceVariant: '#64746f',
        surface: '#ffffff',
    },
};

function normalizePickedAsset(asset) {
    if (!asset?.uri) {
        return null;
    }

    return {
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split('/').pop() || 'incident-photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
    };
}

export default function ReportIncidentScreen() {
    const router = useRouter();
    const { token, refreshIncidents } = useAppContext();
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const nextErrors = {};

        if (!title.trim()) {
            nextErrors.title = 'El asunto es obligatorio.';
        }

        if (!location.trim()) {
            nextErrors.location = 'La ubicación es obligatoria.';
        }

        if (!description.trim()) {
            nextErrors.description = 'La descripción es obligatoria.';
        }

        if (!photo) {
            nextErrors.photo = 'Debes adjuntar una foto de la incidencia.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const requestCameraPermission = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Debes permitir el acceso a la cámara para tomar la foto.');
            return false;
        }
        return true;
    };

    const requestLibraryPermission = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Debes permitir el acceso a tus fotos para adjuntar evidencia.');
            return false;
        }
        return true;
    };

    const handleTakePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.75,
        });

        if (!result.canceled && result.assets?.[0]) {
            setPhoto(normalizePickedAsset(result.assets[0]));
            setErrors((current) => ({ ...current, photo: undefined }));
        }
    };

    const handlePickFromLibrary = async () => {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.75,
        });

        if (!result.canceled && result.assets?.[0]) {
            setPhoto(normalizePickedAsset(result.assets[0]));
            setErrors((current) => ({ ...current, photo: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            await createIncident(token, {
                title: title.trim(),
                location: location.trim(),
                description: description.trim(),
                image: photo,
            });

            await refreshIncidents();
            Alert.alert('Incidencia reportada', 'La incidencia fue enviada correctamente.');
            router.replace('/(tabs)/Incidents');
        } catch (error) {
            console.error('Error al reportar incidencia:', error);
            Alert.alert(
                'No se pudo reportar la incidencia',
                error?.message || 'El servidor rechazó la solicitud.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen options={{ title: 'Reportar incidencia', headerShown: false }} />

            <View style={styles.header}>
                <Text style={styles.eyebrow}>Nuevo reporte</Text>
                <Text style={styles.title}>Registrar incidencia</Text>
                <Text style={styles.subtitle}>
                    Describe el problema, indica la ubicación y toma una foto para dejar evidencia.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.photoPanel}>
                    {photo ? (
                        <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
                    ) : (
                        <View style={styles.photoFallback}>
                            <Text style={styles.photoFallbackEyebrow}>Evidencia requerida</Text>
                            <Text style={styles.photoFallbackTitle}>Toma una foto del incidente</Text>
                            <Text style={styles.photoFallbackText}>
                                Esto ayuda a validar el reporte y a asignar mejor la tarea al equipo.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.photoActionPrimary} onPress={handleTakePhoto}>
                        <Text style={styles.photoActionPrimaryText}>
                            {photo ? 'Tomar otra foto' : 'Tomar foto'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.photoActionSecondary} onPress={handlePickFromLibrary}>
                        <Text style={styles.photoActionSecondaryText}>Elegir de galería</Text>
                    </TouchableOpacity>
                </View>

                <HelperText type="error" visible={!!errors.photo}>
                    {errors.photo}
                </HelperText>

                <View style={styles.field}>
                    <TextInput
                        label="Asunto"
                        value={title}
                        onChangeText={(value) => {
                            setTitle(value);
                            setErrors((current) => ({ ...current, title: undefined }));
                        }}
                        mode="outlined"
                        theme={customTheme}
                        style={styles.input}
                        textColor="#18201d"
                        outlineStyle={styles.inputOutline}
                        error={!!errors.title}
                    />
                    <HelperText type="error" visible={!!errors.title}>
                        {errors.title}
                    </HelperText>
                </View>

                <View style={styles.field}>
                    <TextInput
                        label="Ubicación"
                        value={location}
                        onChangeText={(value) => {
                            setLocation(value);
                            setErrors((current) => ({ ...current, location: undefined }));
                        }}
                        mode="outlined"
                        theme={customTheme}
                        style={styles.input}
                        textColor="#18201d"
                        outlineStyle={styles.inputOutline}
                        error={!!errors.location}
                    />
                    <HelperText type="error" visible={!!errors.location}>
                        {errors.location}
                    </HelperText>
                </View>

                <View style={styles.field}>
                    <TextInput
                        label="Descripción"
                        value={description}
                        onChangeText={(value) => {
                            setDescription(value);
                            setErrors((current) => ({ ...current, description: undefined }));
                        }}
                        mode="outlined"
                        theme={customTheme}
                        style={[styles.input, styles.multilineInput]}
                        textColor="#18201d"
                        outlineStyle={styles.inputOutline}
                        multiline
                        numberOfLines={5}
                        error={!!errors.description}
                    />
                    <HelperText type="error" visible={!!errors.description}>
                        {errors.description}
                    </HelperText>
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.primaryButton}
                    buttonColor="#0f2f29"
                    textColor="#f4f7f5"
                    loading={loading}
                    disabled={loading}
                    contentStyle={styles.primaryButtonContent}
                >
                    Enviar incidencia
                </Button>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
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
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    photoPanel: {
        minHeight: 240,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d3e4ef',
        backgroundColor: '#eef5f9',
        marginBottom: 14,
    },
    photoPreview: {
        width: '100%',
        height: 240,
    },
    photoFallback: {
        minHeight: 240,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 22,
    },
    photoFallbackEyebrow: {
        color: '#6b7d78',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    photoFallbackTitle: {
        color: '#16211e',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    photoFallbackText: {
        color: '#64746f',
        fontSize: 14,
        lineHeight: 21,
        maxWidth: 260,
    },
    photoActions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 4,
    },
    photoActionPrimary: {
        flex: 1,
        backgroundColor: '#10342d',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    photoActionPrimaryText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },
    photoActionSecondary: {
        flex: 1,
        backgroundColor: '#f3f6f4',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d9e5e0',
    },
    photoActionSecondaryText: {
        color: '#17342d',
        fontSize: 14,
        fontWeight: '800',
    },
    field: {
        marginTop: 8,
    },
    input: {
        backgroundColor: '#ffffff',
    },
    inputOutline: {
        borderRadius: 18,
        borderColor: '#cad7d2',
    },
    multilineInput: {
        minHeight: 126,
    },
    primaryButton: {
        borderRadius: 18,
        marginTop: 12,
    },
    primaryButtonContent: {
        minHeight: 54,
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 6,
    },
    secondaryButtonText: {
        color: '#64746f',
        fontSize: 14,
        fontWeight: '700',
    },
});
