import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { CustomSearchBar } from "../../src/components/CustomSearchBar";
import { useAppContext } from "../../src/context/AppContext";

const FILTERS = [
    { key: "all", label: "Todo" },
    { key: "pending", label: "Pendiente" },
    { key: "in_progress", label: "En progreso" },
    { key: "completed", label: "Completada" },
];

function getStatusStyles(status) {
    if (status === "completed") {
        return {
            badge: styles.badgeCompleted,
            badgeText: styles.badgeTextCompleted,
            dot: styles.dotCompleted,
        };
    }

    if (status === "in_progress") {
        return {
            badge: styles.badgeProgress,
            badgeText: styles.badgeTextProgress,
            dot: styles.dotProgress,
        };
    }

    return {
        badge: styles.badgePending,
        badgeText: styles.badgeTextPending,
        dot: styles.dotPending,
    };
}

export default function IncidentsScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { incidents, refreshIncidents, incidentsLoaded, stats } = useAppContext();

    useEffect(() => {
        if (!incidentsLoaded) {
            refreshIncidents().catch((error) => {
                Alert.alert("Error al cargar datos", error.message);
                console.error("Error al cargar datos:", error);
            });
        }
    }, [incidentsLoaded, refreshIncidents]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toUpperCase();

        return incidents
            .filter((item) => statusFilter === "all" || item.status === statusFilter)
            .filter((item) => {
                if (!query) {
                    return true;
                }

                const searchableContent = [
                    item.title,
                    item.description,
                    item.location,
                    item.assignedCleanerName,
                    item.priority,
                    ...(item.tasks || []).map((task) => task.title),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toUpperCase();

                return searchableContent.includes(query);
            });
    }, [incidents, search, statusFilter]);

    const refreshScreen = async () => {
        setRefreshing(true);
        setSearch("");

        try {
            await refreshIncidents();
        } catch (error) {
            Alert.alert("Error al actualizar datos", error.message);
            console.error("Error al actualizar datos:", error);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.content}
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            refreshing={refreshing}
            onRefresh={refreshScreen}
            ListHeaderComponent={
                <View>
                    <View style={styles.header}>
                        <Text style={styles.eyebrow}>Seguimiento</Text>
                        <Text style={styles.title}>Bandeja de incidencias</Text>
                        <Text style={styles.subtitle}>
                            Revisa el listado general, el estado operativo y los responsables. El calendario queda reservado para tareas programadas por fecha.
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, styles.summaryCardNeutral]}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={styles.summaryValue}>{stats.total}</Text>
                        </View>
                        <View style={[styles.summaryCard, styles.summaryCardWarning]}>
                            <Text style={styles.summaryLabel}>Pendientes</Text>
                            <Text style={styles.summaryValue}>{stats.pending}</Text>
                        </View>
                        <View style={[styles.summaryCard, styles.summaryCardCool]}>
                            <Text style={styles.summaryLabel}>Activas</Text>
                            <Text style={styles.summaryValue}>{stats.inProgress}</Text>
                        </View>
                    </View>

                    <CustomSearchBar
                        onChangeText={setSearch}
                        value={search}
                        placeholder="Buscar por incidencia, ubicación o responsable"
                    />

                    <View style={styles.filterRow}>
                        {FILTERS.map((filter) => {
                            const active = statusFilter === filter.key;

                            return (
                                <TouchableOpacity
                                    key={filter.key}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                    onPress={() => setStatusFilter(filter.key)}
                                >
                                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.listHeaderRow}>
                        <Text style={styles.sectionTitle}>Listado general</Text>
                        <TouchableOpacity
                            style={styles.reportButton}
                            onPress={() => router.push('/ReportIncident')}
                        >
                            <Text style={styles.reportButtonText}>Nueva incidencia</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionMeta}>{filteredItems.length} resultados</Text>
                </View>
            }
            renderItem={({ item }) => {
                const statusStyles = getStatusStyles(item.status);

                return (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push({
                            pathname: "/IncidentDetail",
                            params: { id: String(item.id), type: 'incident' }
                        })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.titleBlock}>
                                <View style={[styles.statusDot, statusStyles.dot]} />
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            </View>

                            <View style={[styles.statusBadge, statusStyles.badge]}>
                                <Text style={[styles.statusBadgeText, statusStyles.badgeText]}>
                                    {item.statusLabel}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {item.description || "Sin descripción registrada."}
                        </Text>

                        <View style={styles.metaGrid}>
                            <View style={styles.metaBlock}>
                                <Text style={styles.metaLabel}>Ubicación</Text>
                                <Text style={styles.metaValue}>{item.location}</Text>
                            </View>
                            <View style={styles.metaBlock}>
                                <Text style={styles.metaLabel}>Responsable</Text>
                                <Text style={styles.metaValue}>{item.assignedCleanerName}</Text>
                            </View>
                        </View>

                        <View style={styles.footerRow}>
                            <Text style={styles.footerInfo}>
                                Estado registrado: {item.statusLabel}
                            </Text>
                            <Text style={styles.footerAction}>Ver detalle</Text>
                        </View>
                    </TouchableOpacity>
                );
            }}
            ListEmptyComponent={
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No hay resultados disponibles</Text>
                    <Text style={styles.emptyText}>
                        Prueba con otro filtro o actualiza la lista para volver a consultar la bandeja general.
                    </Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f6f4",
    },
    content: {
        padding: 20,
        paddingBottom: 34,
    },
    header: {
        marginTop: 54,
        marginBottom: 18,
    },
    eyebrow: {
        color: "#6b7d78",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1.1,
        marginBottom: 8,
    },
    title: {
        color: "#16211e",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        color: "#64746f",
        fontSize: 15,
        lineHeight: 22,
    },
    summaryRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
    },
    summaryCardNeutral: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d9e5e0",
    },
    summaryCardWarning: {
        backgroundColor: "#f7efe3",
        borderWidth: 1,
        borderColor: "#ebdec5",
    },
    summaryCardCool: {
        backgroundColor: "#eaf3f8",
        borderWidth: 1,
        borderColor: "#d3e4ef",
    },
    summaryLabel: {
        color: "#687974",
        fontSize: 12,
        marginBottom: 8,
    },
    summaryValue: {
        color: "#16211e",
        fontSize: 28,
        fontWeight: "800",
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 18,
    },
    filterChip: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d3dfda",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    filterChipActive: {
        backgroundColor: "#10342d",
        borderColor: "#10342d",
    },
    filterChipText: {
        color: "#596a65",
        fontSize: 13,
        fontWeight: "700",
    },
    filterChipTextActive: {
        color: "#f4f7f5",
    },
    listHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        color: "#16211e",
        fontSize: 19,
        fontWeight: "800",
    },
    sectionMeta: {
        color: "#64746f",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 12,
    },
    reportButton: {
        backgroundColor: "#10342d",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    reportButtonText: {
        color: "#f4f7f5",
        fontSize: 12,
        fontWeight: "800",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "#d9e5e0",
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 10,
    },
    titleBlock: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
        marginTop: 1,
    },
    dotPending: {
        backgroundColor: "#c48a21",
    },
    dotProgress: {
        backgroundColor: "#1676a1",
    },
    dotCompleted: {
        backgroundColor: "#1f9b66",
    },
    cardTitle: {
        flex: 1,
        color: "#16211e",
        fontSize: 17,
        fontWeight: "800",
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "800",
    },
    badgePending: {
        backgroundColor: "#f5ebd8",
    },
    badgeTextPending: {
        color: "#936b20",
    },
    badgeProgress: {
        backgroundColor: "#e3eff6",
    },
    badgeTextProgress: {
        color: "#14688f",
    },
    badgeCompleted: {
        backgroundColor: "#e5f4ec",
    },
    badgeTextCompleted: {
        color: "#1b8659",
    },
    cardDescription: {
        color: "#64746f",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 14,
    },
    metaGrid: {
        flexDirection: "row",
        gap: 10,
    },
    metaBlock: {
        flex: 1,
        backgroundColor: "#f6f9f7",
        borderRadius: 16,
        padding: 12,
    },
    metaLabel: {
        color: "#72827d",
        fontSize: 11,
        textTransform: "uppercase",
        fontWeight: "700",
        marginBottom: 4,
        letterSpacing: 0.8,
    },
    metaValue: {
        color: "#16211e",
        fontSize: 13,
        fontWeight: "700",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#eef3f0",
    },
    footerInfo: {
        color: "#64746f",
        fontSize: 13,
    },
    footerAction: {
        color: "#10342d",
        fontSize: 13,
        fontWeight: "800",
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "#d9e5e0",
        marginTop: 8,
    },
    emptyTitle: {
        color: "#16211e",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 6,
    },
    emptyText: {
        color: "#687974",
        fontSize: 14,
        lineHeight: 21,
    },
});
