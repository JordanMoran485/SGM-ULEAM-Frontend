import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList, Platform, ScrollView, StyleSheet,
    Text, TouchableOpacity, UIManager, View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomSearchBar } from "../../src/components/CustomSearchBar";
import { useAppContext } from "../../src/context/AppContext";
import { useToast } from "../../src/components/Toast";

const FILTERS = [
    { key: "all",       label: "Todas" },
    { key: "pending",   label: "Pendiente" },
    { key: "revisada",  label: "Revisada" },
    { key: "rechazada", label: "Rechazada" },
];

const SPACE_TYPES = new Set(["Baño", "Aula", "Pasillo", "Exteriores", "Escaleras"]);

const SPACE_TYPE_ICONS = {
    "Baño":       "toilet",
    "Aula":       "school-outline",
    "Pasillo":    "door-open",
    "Exteriores": "tree-outline",
    "Escaleras":  "stairs",
};

function getEffectiveStatus(status, approvalStatus) {
    if (approvalStatus === "Rechazada") return "rechazada";
    if (status === "completed")         return "completed";
    if (status === "in_progress")       return "in_progress";
    if (approvalStatus === "Aceptada")  return "revisada";
    return "pending";
}

function getStatusConfig(effectiveStatus) {
    switch (effectiveStatus) {
        case "rechazada":   return { stripe: "#F43F5E", badgeBg: "#FFE4E8", badgeText: "#F43F5E", iconBg: "#FFE4E8", iconColor: "#F43F5E", label: "Rechazada" };
        case "completed":   return { stripe: "#22C55E", badgeBg: "#DCFCE7", badgeText: "#16A34A", iconBg: "#DCFCE7", iconColor: "#22C55E", label: "Completada" };
        case "in_progress": return { stripe: "#4A6CF7", badgeBg: "#E8EDFF", badgeText: "#2D3FE0", iconBg: "#E8EDFF", iconColor: "#4A6CF7", label: "En progreso" };
        case "revisada":    return { stripe: "#06B6D4", badgeBg: "#E8F8FB", badgeText: "#06B6D4", iconBg: "#E8F8FB", iconColor: "#06B6D4", label: "Revisada" };
        default:            return { stripe: "#F59E0B", badgeBg: "#FEF3C7", badgeText: "#D97706", iconBg: "#FEF3C7", iconColor: "#F59E0B", label: "Pendiente" };
    }
}

function parseLocation(location) {
    if (!location) return { spaceType: null, address: null };
    const sep = location.indexOf(" - ");
    if (sep !== -1) {
        const candidate = location.slice(0, sep);
        if (SPACE_TYPES.has(candidate)) {
            return { spaceType: candidate, address: location.slice(sep + 3) || null };
        }
    }
    return { spaceType: null, address: location };
}

function formatRelative(value) {
    if (!value) return "";
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60)    return "Ahora";
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" }).format(new Date(value));
}

function StatusTab({ label, active, count, onPress }) {
    if (active) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.tabWrapper}>
                <LinearGradient
                    colors={["#2D3FE0", "#4A6CF7"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.tabActive}
                >
                    <Text style={styles.tabActiveText}>{label}</Text>
                    {count !== undefined && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{count}</Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.tabWrapper, styles.tabInactive]}>
            <Text style={styles.tabInactiveText}>{label}</Text>
            {count !== undefined && count > 0 && (
                <View style={styles.tabBadgeInactive}>
                    <Text style={styles.tabBadgeInactiveText}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function IncidentsScreen() {
    const [search, setSearch]           = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [refreshing, setRefreshing]   = useState(false);

    const router = useRouter();
    const toast = useToast();
    const { incidents, refreshIncidents, incidentsLoaded } = useAppContext();

    useEffect(() => {
        if (!incidentsLoaded) {
            refreshIncidents().catch((error) => toast.error("Error al cargar datos", error.message));
        }
    }, [incidentsLoaded, refreshIncidents]);

    const counts = useMemo(() => {
        const result = { all: incidents.length, pending: 0, in_progress: 0, revisada: 0, rechazada: 0, completed: 0 };
        incidents.forEach((item) => {
            const ef = getEffectiveStatus(item.status, item.approvalStatus);
            if (result[ef] !== undefined) result[ef] += 1;
        });
        return result;
    }, [incidents]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toUpperCase();
        return incidents
            .filter((item) => {
                if (statusFilter === "all") return true;
                return getEffectiveStatus(item.status, item.approvalStatus) === statusFilter;
            })
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
            toast.error("Error al actualizar datos", error.message);
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

                {/* Fila superior */}
                <View style={{ position: "absolute", top: 18, left: "8%", transform: [{ rotate: "-10deg" }] }}>
                    <MaterialCommunityIcons name="camera-outline" size={44} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: "absolute", top: 10, left: "40%", transform: [{ rotate: "14deg" }] }}>
                    <MaterialCommunityIcons name="clipboard-alert-outline" size={64} color="rgba(255,255,255,0.08)" />
                </View>
                <View style={{ position: "absolute", top: 20, right: "10%", transform: [{ rotate: "-16deg" }] }}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={50} color="rgba(255,255,255,0.07)" />
                </View>

                {/* Fila inferior */}
                <View style={{ position: "absolute", bottom: 14, left: "6%", transform: [{ rotate: "18deg" }] }}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={56} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: "absolute", bottom: 10, left: "42%", transform: [{ rotate: "-8deg" }] }}>
                    <MaterialCommunityIcons name="camera-outline" size={52} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={{ position: "absolute", bottom: -28, right: -18, transform: [{ rotate: "15deg" }] }}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={148} color="rgba(255,255,255,0.07)" />
                </View>

                <View style={styles.heroRow}>
                    <View>
                        <Text style={styles.heroEyebrow}>Seguimiento</Text>
                        <Text style={styles.heroTitle}>Incidencias</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push("/ReportIncident")}
                        style={styles.heroNewBtn}
                    >
                        <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                        <Text style={styles.heroNewBtnText}>Nueva</Text>
                    </TouchableOpacity>
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

            {/* ── Tabs de estado ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsRow}
                style={styles.tabsScroll}
            >
                {FILTERS.map((f) => (
                    <StatusTab
                        key={f.key}
                        label={f.label}
                        active={statusFilter === f.key}
                        count={f.key === "all" ? counts.all : counts[f.key]}
                        onPress={() => setStatusFilter(f.key)}
                    />
                ))}
            </ScrollView>

            {/* ── Contador de resultados ── */}
            {search.trim() !== "" && (
                <Text style={styles.resultsCount}>{filteredItems.length} resultado{filteredItems.length !== 1 ? "s" : ""}</Text>
            )}
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
                const effective = getEffectiveStatus(item.status, item.approvalStatus);
                const sc = getStatusConfig(effective);
                const { spaceType, address } = parseLocation(item.location);
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
                            <MaterialCommunityIcons
                                name={SPACE_TYPE_ICONS[spaceType] ?? "alert-circle-outline"}
                                size={22}
                                color={sc.iconColor}
                            />
                        </View>
                        <View style={styles.cardInfo}>
                            <View style={styles.cardTopRow}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.cardTime}>{formatRelative(item.createdAt)}</Text>
                            </View>
                            {address && (
                                <Text style={styles.cardLocation} numberOfLines={1}>{address}</Text>
                            )}
                            <View style={styles.cardTags}>
                                <View style={[styles.cardTag, { backgroundColor: sc.badgeBg }]}>
                                    <Text style={[styles.cardTagText, { color: sc.badgeText }]}>{sc.label}</Text>
                                </View>
                                {spaceType && (
                                    <View style={styles.cardSpaceTag}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={11} color="#4A6CF7" />
                                        <Text style={styles.cardSpaceTagText}>{spaceType}</Text>
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
                    <Text style={styles.emptyText}>Prueba con otro filtro o actualiza la lista.</Text>
                    {statusFilter !== "all" && (
                        <TouchableOpacity onPress={() => setStatusFilter("all")} activeOpacity={0.85} style={styles.emptyAction}>
                            <Text style={styles.emptyActionText}>Ver todas</Text>
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
        paddingTop: 72,
        paddingBottom: 44,
        paddingHorizontal: 24,
        overflow: "hidden",
    },
    decCircle1: {
        position: "absolute", top: -40, right: -40,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    decCircle2: {
        position: "absolute", bottom: -30, left: -20,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
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
    heroNewBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 9,
        marginBottom: 4,
    },
    heroNewBtnText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },

    // Search
    searchWrapper: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 4,
    },

    // Tabs
    tabsScroll: {
        marginTop: 12,
    },
    tabsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 8,
        paddingBottom: 4,
    },
    tabWrapper: {
        borderRadius: 999,
        overflow: "hidden",
    },
    tabActive: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
    },
    tabActiveText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },
    tabBadge: {
        backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: 999,
        minWidth: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
    },
    tabBadgeText: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "800",
    },
    tabInactive: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 9,
        shadowColor: "#4A6CF7",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    tabInactiveText: {
        color: "#8F95B2",
        fontSize: 13,
        fontWeight: "600",
    },
    tabBadgeInactive: {
        backgroundColor: "#E8EDFF",
        borderRadius: 999,
        minWidth: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
    },
    tabBadgeInactiveText: {
        color: "#4A6CF7",
        fontSize: 10,
        fontWeight: "700",
    },

    // Contador
    resultsCount: {
        color: "#8F95B2",
        fontSize: 12,
        fontWeight: "500",
        paddingHorizontal: 24,
        marginTop: 12,
        marginBottom: 4,
    },

    // Cards
    card: {
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 16,
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
    cardSpaceTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E8EDFF",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    cardSpaceTagText: {
        color: "#4A6CF7",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Empty
    emptyWrapper: {
        alignItems: "center",
        paddingHorizontal: 32,
        paddingTop: 48,
        gap: 16,
    },
    emptyDecoCard: {
        width: 100, height: 100, borderRadius: 28,
        alignItems: "center", justifyContent: "center",
        overflow: "hidden", marginBottom: 8,
        shadowColor: "#2D3FE0", shadowOpacity: 0.25,
        shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    emptyDecoCircle: {
        position: "absolute", top: -20, right: -20,
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    emptyTitle: {
        color: "#1A1F36", fontSize: 20, fontWeight: "800", textAlign: "center",
    },
    emptyText: {
        color: "#8F95B2", fontSize: 14, lineHeight: 21, textAlign: "center",
    },
    emptyAction: {
        backgroundColor: "#E8EDFF",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 4,
    },
    emptyActionText: {
        color: "#4A6CF7", fontSize: 13, fontWeight: "700",
    },
});
