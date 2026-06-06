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
        badgeBg: "#DCFCE7", badgeText: "#16A34A",
        iconBg: "#DCFCE7",  iconColor: "#22C55E",
        label: "Completada",
    };
    if (status === "in_progress") return {
        stripe: "#4A6CF7",
        badgeBg: "#E8EDFF", badgeText: "#2D3FE0",
        iconBg: "#E8EDFF",  iconColor: "#4A6CF7",
        label: "En progreso",
    };
    return {
        stripe: "#F59E0B",
        badgeBg: "#FEF3C7", badgeText: "#D97706",
        iconBg: "#FEF3C7",  iconColor: "#F59E0B",
        label: "Pendiente",
    };
}

function formatRelative(value) {
    if (!value) return "";
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return "Ahora";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" }).format(new Date(value));
}

const INCIDENT_CATEGORIES = [
    { icon: "pipe-wrench" },
    { icon: "lightning-bolt" },
    { icon: "broom" },
    { icon: "alert-circle-outline" },
];

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
            renderItem={({ item, index }) => {
                const sc  = getStatusConfig(item.status);
                const cat = INCIDENT_CATEGORIES[index % INCIDENT_CATEGORIES.length];
                return (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => router.push({
                            pathname: "/IncidentDetail",
                            params: { id: String(item.id), type: "incident" },
                        })}
                    >
                        <View style={[styles.stripe, { backgroundColor: sc.stripe }]} />
                        <View style={[styles.cardIconBox, { backgroundColor: sc.iconBg }]}>
                            <MaterialCommunityIcons name={cat.icon} size={22} color={sc.iconColor} />
                        </View>
                        <View style={styles.cardInfo}>
                            <View style={styles.cardTopRow}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.cardTime}>{formatRelative(item.createdAt)}</Text>
                            </View>
                            {item.location && (
                                <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                            )}
                            <View style={styles.cardTags}>
                                <View style={[styles.cardTag, { backgroundColor: sc.badgeBg }]}>
                                    <Text style={[styles.cardTagText, { color: sc.badgeText }]}>{sc.label}</Text>
                                </View>
                                {item.location && (
                                    <View style={styles.cardLocationChip}>
                                        <MaterialCommunityIcons name="map-marker" size={12} color="#8F95B2" />
                                        <Text style={styles.cardLocationChipText} numberOfLines={1}>{item.location}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={22} color="#C7D2FE" />
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
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        paddingLeft: 20,
        overflow: "hidden",
        shadowColor: "#4A6CF7",
        shadowOpacity: 0.09,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    stripe: {
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 4,
    },
    cardIconBox: {
        width: 48, height: 48, borderRadius: 14,
        alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    cardInfo: {
        flex: 1, minWidth: 0, gap: 4,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardTitle: {
        flex: 1,
        color: "#1A1F36",
        fontSize: 14,
        fontWeight: "800",
    },
    cardTime: {
        color: "#8F95B2",
        fontSize: 10,
        fontWeight: "500",
        marginLeft: 8,
        flexShrink: 0,
    },
    cardLocation: {
        color: "#8F95B2",
        fontSize: 12,
        fontWeight: "500",
    },
    cardTags: {
        flexDirection: "row",
        gap: 6,
        marginTop: 2,
        alignItems: "center",
    },
    cardTag: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    cardTagText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    cardLocationChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    cardLocationChipText: {
        color: "#8F95B2",
        fontSize: 11,
        fontWeight: "500",
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
