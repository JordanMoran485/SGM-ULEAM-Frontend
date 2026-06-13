import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function CustomSearchBar({ onChangeText, value, placeholder }) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.iconBox}>
                <MaterialCommunityIcons name="magnify" size={18} color="#4A6CF7" />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#B0B7D3"
                value={value}
                onChangeText={onChangeText}
                returnKeyType="search"
                clearButtonMode="never"
            />
            {value.length > 0 && (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onChangeText("")}
                    style={styles.clearBtn}
                >
                    <MaterialCommunityIcons name="close-circle" size={18} color="#B0B7D3" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
        shadowColor: "#4A6CF7",
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#E8EDFF",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: "#1A1F36",
        paddingVertical: 0,
    },
    clearBtn: {
        flexShrink: 0,
        padding: 2,
    },
});
