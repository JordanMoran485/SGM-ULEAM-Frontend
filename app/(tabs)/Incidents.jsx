import React, { useEffect, useMemo, useState } from "react";
import {
    Alert, FlatList, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomSearchBar } from "../../src/components/CustomSearchBar";
import { useAppContext } from "../../src/context/AppContext";

const FILTERS = [
    { key: "all",         label: "Todas" },
    { key: "pending",     label: "Pendiente" },
    { key: "in_progress", label: "En progreso" },
    { key: "completed",   label: "Completada" },
];

function getStatusConfig(status) {
    if (status === "completed") return {
        stripe: "#22C55E",
        badgeBg: "#F0FDF4",
        badgeText: "#22C55E",
    };
    if (status === "in_progress") return {
        stripe: "#4A6CF7",
        badgeBg: "#E8EDFF",
        badgeText: "#2D3FE0",
    };
    return {
        stripe: "#F59E0B",
        badgeBg: "#FFFBEB",
        badgeText: "#B45309",
    };
}

function getPriorityConfig(priority) {
    const p = String(priority || "").toLowerCase();
    if (p === "alta" || p === "high")   return { bg: "#FFF1F2", text: "#F43F5E" };
    if (p === "baja" || p === "low")    return { bg: "#F0FDF4", text: "#22C55E" };
    return { bg: "#E8EDFF", text: "#4A6CF7" };
}

function FilterTab({ label, active, onPress }) {
    if (active) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.filterTabWrapper}>
                <LinearGradient
                    colors={["#2D3FE0", "#4A6CF7"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.filterTabActive}
                >
                    <Text style={styles.filterTabActiveText}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.filterTabWrapper, styles.filterTabInactive]}>
            <Text style={styles.filterTabInactiveText}>{label}</Text>
        </TouchableOpacity>
    );
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
            });
        }
    }, [incidentsLoaded, refreshIncidents]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toUpperCase();
        return incidents
            .filter((item) => statusFilter === "all" || item.status === statusFilter)
            .filter((item) => {
                if (!query) return true;
                const searchable = [
                    item.title, item.description, item.location,
                    item.assignedCleanerName, item.priority,
                    ...(item.tasks || []).map((t) => t.title),
                ].filter(Boolean).join(" ").toUpperCase();
                return searchable.includes(query);
            });
    }, [incidents, search, statusFilter]);

    const refreshScreen = async () => {
        setRefreshing(true);
        setSearch("");
        try {
            await refreshIncidents();
        } catch (error) {
            Alert.alert("Error al actualizar datos", error.message);
        } finally {
            setRefreshing(false);
        }
    };

    const ListHeader = (
        <>
            {/* ── Hero ── */}
            <LinearGradient
                colors={["#2D3FE0", "#4A6CF7", "#7B9FFF"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <View style={styles.decCircle1} />
                <View style={styles.decCircle2} />

                <View style={styles.heroTop}>
                    <Text style={styles.heroEyebrow}>Seguimiento</Text>
                    <Text style={styles.heroTitle}>Incidencias</Text>
                </View>

                {/* Stats integrados en el hero */}
                <View style={styles.statsRow}>
                    <View style={styles.statPill}>
                        <Text style={styles.statNumber}>{stats.total ?? 0}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statPill}>
                        <Text style={styles.statNumber}>{stats.pending ?? 0}</Text>
                        <Text style={styles.statLabel}>Pendientes</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statPill}>
                        <Text style={styles.statNumber}>{stats.inProgress ?? 0}</Text>
                        <Text style={styles.statLabel}>Activas</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Buscador ── */}
            <View style={styles.searchWrapper}>
                <CustomSearchBar
                    onChangeText={setSearch}
                    value={search}
                    placeholder="Buscar incidencia, ubicación o responsable"
                />
            </View>

            {/* ── Filtros ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {FILTERS.map((f) => (
                    <FilterTab
                        key={f.key}
                        label={f.label}
                        active={statusFilter === f.key}
                        onPress={() => setStatusFilter(f.key)}
                    />
                ))}
            </ScrollView>

            {/* ── Header de sección ── */}
            <View style={styles.sectionRow}>
                <View>
                    <Text style={styles.sectionTitle}>Listado general</Text>
                    <Text style={styles.sectionMeta}>{filteredItems.length} resultados</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push("/ReportIncident")}
                    activeOpacity={0.85}
                    style={styles.newBtnWrapper}
                >
                    <LinearGradient
                        colors={["#2D3FE0", "#4A6CF7"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.newBtn}
                    >
                        <MaterialCommunityIcons name="plus" size={15} color="#fff" />
                        <Text style={styles.newBtnText}>Nueva</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.content}
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            refreshing={refreshing}
            onRefresh={refreshScreen}
            ListHeaderComponent={ListHeader}
            renderItem={({ item }) => {
                const sc = getStatusConfig(item.status);
                const pc = getPriorityConfig(item.priority);

                return (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => router.push({
                            pathname: "/IncidentDetail",
                            params: { id: String(item.id), type: "incident" },
                        })}
                    >
                        {/* Franja lateral de estado */}
                        <View style={[styles.stripe, { backgroundColor: sc.stripe }]} />

                        <View style={styles.cardInner}>
                            {/* Fila superior: badges + prioridad */}
                            <View style={styles.cardTopRow}>
                                <View style={[styles.badge, { backgroundColor: sc.badgeBg }]}>
                                    <Text style={[styles.badgeText, { color: sc.badgeText }]}>
                                        {item.statusLabel}
                                    </Text>
                                </View>
                                {item.priority && (
                                    <View style={[styles.badge, { backgroundColor: pc.bg }]}>
                                        <Text style={[styles.badgeText, { color: pc.text }]}>
                                            {item.priority}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Título */}
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

                            {/* Descripción */}
                            <Text style={styles.cardDescription} numberOfLines={2}>
                                {item.description || "Sin descripción registrada."}
                            </Text>

                            {/* Fila inferior: ubicación + responsable + ver */}
                            <View style={styles.cardBottomRow}>
                                <View style={styles.chipsRow}>
                                    {item.location && (
                                        <View style={styles.chip}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={11} color="#8F95B2" />
                                            <Text style={styles.chipText} numberOfLines={1}>{item.location}</Text>
                                        </View>
                                    )}
                                    {item.assignedCleanerName && (
                                        <View style={styles.chip}>
                                            <MaterialCommunityIcons name="account-outline" size={11} color="#8F95B2" />
                                            <Text style={styles.chipText} numberOfLines={1}>{item.assignedCleanerName}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.actionBtn}>
                                    <Text style={styles.actionBtnText}>Ver</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={13} color="#4A6CF7" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            }}
            ListEmptyComponent={
                <View style={styles.emptyWrapper}>
                    <LinearGradient
                        colors={["#2D3FE0", "#4A6CF7", "#7B9FFF"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.emptyDecoCard}
                    >
                        <View style={styles.emptyDecoCircle} />
                        <MaterialCommunityIcons name="clipboard-text-off-outline" size={36} color="rgba(255,255,255,0.9)" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>Sin resultados</Text>
                    <Text style={styles.emptyText}>
                        Prueba con otro filtro o actualiza la lista.
                    </Text>
                    {statusFilter !== "all" && (
                        <TouchableOpacity
                            onPress={() => { setStatusFilter("all"); setSearch(""); }}
                            activeOpacity={0.85}
                            style={styles.emptyAction}
                        >
                            <Text style={styles.emptyActionText}>Limpiar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF2FF",
    },
    content: {
        paddingBottom: 40,
    },

    // Hero
    hero: {
        paddingTop: 64,
        paddingBottom: 24,
        paddingHorizontal: 24,
        overflow: "hidden",
        position: "relative",
    },
    decCircle1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    decCircle2: {
        position: "absolute",
        bottom: -30,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroTop: {
        marginBottom: 20,
    },
    heroEyebrow: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.1,
        textTransform: "uppercase",
        marginBottom: 6,
    },
    heroTitle: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "800",
    },

    // Stats en hero
    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
    },
    statPill: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "800",
        lineHeight: 26,
    },
    statLabel: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        fontWeight: "600",
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: "rgba(255,255,255,0.20)",
    },

    // Search
    searchWrapper: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 4,
    },

    // Filtros
    filterRow: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
        flexDirection: "row",
    },
    filterTabWrapper: {
        borderRadius: 999,
        overflow: "hidden",
    },
    filterTabActive: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 999,
    },
    filterTabActiveText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },
    filterTabInactive: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 18,
        paddingVertical: 9,
        shadowColor: "#4A6CF7",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    filterTabInactiveText: {
        color: "#8F95B2",
        fontSize: 13,
        fontWeight: "600",
    },

    // Sección
    sectionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        color: "#1A1F36",
        fontSize: 17,
        fontWeight: "700",
    },
    sectionMeta: {
        color: "#8F95B2",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 2,
    },
    newBtnWrapper: {
        borderRadius: 999,
        overflow: "hidden",
    },
    newBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
    },
    newBtnText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },

    // Card
    card: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#4A6CF7",
        shadowOpacity: 0.09,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    stripe: {
        width: 4,
    },
    cardInner: {
        flex: 1,
        padding: 16,
        gap: 6,
    },
    cardTopRow: {
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    cardTitle: {
        color: "#1A1F36",
        fontSize: 15,
        fontWeight: "800",
        lineHeight: 20,
    },
    cardDescription: {
        color: "#8F95B2",
        fontSize: 13,
        lineHeight: 19,
    },
    cardBottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
        gap: 8,
    },
    chipsRow: {
        flexDirection: "row",
        gap: 6,
        flex: 1,
        flexWrap: "wrap",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#F1F3FF",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        maxWidth: 130,
    },
    chipText: {
        color: "#8F95B2",
        fontSize: 11,
        fontWeight: "600",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E8EDFF",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
        flexShrink: 0,
    },
    actionBtnText: {
        color: "#4A6CF7",
        fontSize: 12,
        fontWeight: "700",
    },

    // Empty
    emptyWrapper: {
        alignItems: "center",
        paddingHorizontal: 32,
        paddingTop: 32,
        gap: 16,
    },
    emptyDecoCard: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        marginBottom: 8,
        shadowColor: "#2D3FE0",
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    emptyDecoCircle: {
        position: "absolute",
        top: -20,
        right: -20,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    emptyTitle: {
        color: "#1A1F36",
        fontSize: 20,
        fontWeight: "800",
        textAlign: "center",
    },
    emptyText: {
        color: "#8F95B2",
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
    },
    emptyAction: {
        backgroundColor: "#E8EDFF",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 4,
    },
    emptyActionText: {
        color: "#4A6CF7",
        fontSize: 13,
        fontWeight: "700",
    },
});
