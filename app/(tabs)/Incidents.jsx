import React, { useState, useEffect } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native"; 
import { CustomSearchBar } from "../../components/CustomSearchBar";

export default function IncidentsScreen() {
    const [search, setSearch] = useState("");
    const [listaOriginal, setListaOriginal] = useState([]);
    const [listaFiltrada, setListaFiltrada] = useState([]);
    const [refrescando, setRefrescando] = useState(false);

    useEffect(() => {

        Recibirdatos();
    }, []);


    const Recibirdatos = async () => {
        try {
            const response = await fetch("http://192.168.100.9:8000/api/incidents");
            const datos = await response.json();
            setListaOriginal(datos);
            setListaFiltrada(datos);

        } catch (error) {
            alert("Error al cargar datos: " + error.message);
        }

    }
    const filtrarIncidencias = (texto) => {
        setSearch(texto);

        if (texto.trim() === "") {
            setListaFiltrada(listaOriginal);
        } else {
            const filtrados = listaOriginal.filter((item) => {
                const titulo = item.title.toUpperCase();
                const busqueda = texto.toUpperCase();
                return titulo.includes(busqueda);
            });
            setListaFiltrada(filtrados);
        }
    };
    const RefreshScren = async () => {
        setRefrescando(true);
        setSearch("");
        try {
            await Recibirdatos();

        } catch (error) {
            alert("Error al actualizar datos: " + error.message);
        } finally {
            setRefrescando(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomSearchBar
                onChangeText={filtrarIncidencias} value={search} placeholder="Buscar..."
            />

            <FlatList
                data={listaFiltrada}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => {
    const badgeStyle = 
        item.status === 'pending' ? styles.badgePending : 
        item.status === 'in_progress' ? styles.badgeInProgress : styles.badgeCompleted;

    const textBadgeStyle = 
        item.status === 'pending' ? styles.textoPending : 
        item.status === 'in_progress' ? styles.textoInProgress : styles.textoCompleted;

    return (
        <View style={styles.item}>
            <View style={styles.filaSuperior}>
                <Text style={styles.tituloItem} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, badgeStyle]}>
                    <Text style={[styles.textoBadge, textBadgeStyle]}>{item.status}</Text>
                </View>
            </View>

            <Text style={styles.descripcionItem} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.filaInferior}>
                <View style={styles.contenedorUbicacion}>
                    <Text style={{ fontSize: 12 }}>📍</Text> 
                    <Text style={styles.ubicacionTexto}>{item.location}</Text>
                </View>

                {/* BOTÓN VER */}
                <TouchableOpacity 
                    style={styles.botonVer} 
                    onPress={() => console.log("Ver detalle de:", item.id)}
                >
                    <Text style={styles.textoBoton}>Ver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}}
                refreshing={refrescando}
                onRefresh={RefreshScren}
                ListEmptyComponent={<Text style={styles.vacio}>No hay coincidencias...</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F2F5",
        marginTop: 50,
    },
    item: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 5,
        borderLeftColor: "#0984E3",
    },
    tituloItem: {
        fontSize: 17,
        fontWeight: "700",
        color: "#2D3436",
        marginBottom: 4,
        textTransform: "capitalize",
    },
    descripcionItem: {
        fontSize: 14,
        color: "#636E72",
        lineHeight: 20,
        marginBottom: 10,
    },
    contenedorUbicacion: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F1F2F6",
        paddingTop: 8,
    },
    ubicacionTexto: {
        fontSize: 12,
        color: "#0984E3",
        fontWeight: "600",
        marginLeft: 4,
    },
    vacio: {
        textAlign: "center",
        marginTop: 100,
        color: "#B2BEC3",
        fontSize: 16,
    },
    filaSuperior: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
  filaInferior: {
        flexDirection: "row",
        justifyContent: "space-between", // Separa la ubicación del botón
        alignItems: "center",
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#F1F2F6",
    },
    botonVer: {
        backgroundColor: "#0984E3",
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 8,
        elevation: 2,
    },
    textoBoton: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "bold",
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    textoBadge: {
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    // Colores para cada estado
    badgePending: { backgroundColor: "#FFEAA7" },
    textoPending: { color: "#D6A31E" },
    badgeInProgress: { backgroundColor: "#81ECEC" },
    textoInProgress: { color: "#00838F" },
    badgeCompleted: { backgroundColor: "#55EFC4" },
    textoCompleted: { color: "#00B894" },
});