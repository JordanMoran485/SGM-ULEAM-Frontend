import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

export default function IncidentDetail() {
    const item = useLocalSearchParams();
    const router = useRouter();

    // 1. Cambia esta IP por la de tu computadora (La que sale en php artisan serve)
    const baseUrl = "http://192.168.100.9:8000/storage/"; 

    // 2. FUNCIÓN INTELIGENTE PARA LA IMAGEN
    const getSafeImageUri = () => {
        // Si no hay imagen o es el texto "null", no devolvemos nada
        if (!item.image || item.image === 'null' || item.image === '') {
            return null;
        }

        // Si la imagen ya es una URL completa (como la de Goku de Shutterstock)
        if (item.image.startsWith('http')) {
            return { uri: item.image };
        }

        // Si es solo el nombre de un archivo (Método 2), le pegamos la ruta de Laravel
        return { uri: `${baseUrl}${item.image}` };
    };

    const imageSource = getSafeImageUri();

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.contentContainer}
        >
            <Stack.Screen options={{ title: 'Detalle del Reporte' }} />

            {/* 3. RENDERIZADO CONDICIONAL DE LA IMAGEN */}
            {imageSource ? (
                <Image 
                    source={imageSource} 
                    style={styles.imagenHeader}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.sinImagen}>
                    <Text style={{color: '#B2BEC3', fontWeight: 'bold'}}>📷 Sin imagen adjunta</Text>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.headerInfo}>
                    <Text style={styles.label}>Asunto del Incidente</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Descripción</Text>
                    <Text style={styles.infoText}>{item.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Ubicación</Text>
                    <Text style={styles.infoText}>📍 {item.location}</Text>
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
        height: 300, // Altura para que Goku se vea bien
        backgroundColor: '#000',
    },
    sinImagen: {
        width: '100%',
        height: 200,
        backgroundColor: '#E1E8EE',
        justifyContent: 'center',
        alignItems: 'center',
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