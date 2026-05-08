import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppContext } from '../src/context/AppContext';

export default function IncidentDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { incidents } = useAppContext();

    const incident = useMemo(() => {
        return incidents.find((currentIncident) => String(currentIncident.id) === String(params.id));
    }, [incidents, params.id]);

    const imageSource = incident?.image ? { uri: incident.image } : null;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <Stack.Screen options={{ title: 'Detalle del Reporte' }} />

            {imageSource ? (
                <Image
                    source={imageSource}
                    style={styles.imagenHeader}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.sinImagen}>
                    <Text style={styles.sinImagenTexto}>📷 Sin imagen adjunta</Text>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.headerInfo}>
                    <Text style={styles.label}>Asunto del Incidente</Text>
                    <Text style={styles.title}>{incident?.title || 'Incidencia no encontrada'}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.statusText}>{incident?.statusLabel || 'Pendiente'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Descripción</Text>
                    <Text style={styles.infoText}>{incident?.description || 'Sin descripción registrada.'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Ubicación</Text>
                    <Text style={styles.infoText}>📍 {incident?.location || 'Sin ubicación'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Conserje responsable</Text>
                    <Text style={styles.infoText}>{incident?.assignedCleanerName || 'Sin asignar'}</Text>
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

                <TouchableOpacity
                    style={styles.botonRegresar}
                    onPress={() => router.back()}
                >
                    <Text style={styles.textoBoton}>Volver a la lista</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    contentContainer: {
        paddingBottom: 40,
    },
    imagenHeader: {
        width: '100%',
        height: 300,
        backgroundColor: '#000',
    },
    sinImagen: {
        width: '100%',
        height: 200,
        backgroundColor: '#E1E8EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sinImagenTexto: {
        color: '#B2BEC3',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#FFF',
        marginTop: -20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    headerInfo: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: '#0984E3',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 10,
    },
    badge: {
        backgroundColor: '#DFF9FB',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#0097E6',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 25,
    },
    infoText: {
        fontSize: 16,
        color: '#636E72',
        lineHeight: 24,
    },
    taskCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    taskMeta: {
        fontSize: 13,
        color: '#0984E3',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 20,
    },
    botonRegresar: {
        backgroundColor: '#2D3436',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    textoBoton: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
