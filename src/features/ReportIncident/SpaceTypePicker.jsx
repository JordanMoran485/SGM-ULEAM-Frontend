import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LOCATION_TYPES } from './helpers';

export const SpaceTypePicker = React.memo(function SpaceTypePicker({ value, onChange }) {
    return (
        <View style={s.block}>
            <Text style={s.label}>Tipo de espacio</Text>
            <View style={s.grid}>
                {LOCATION_TYPES.map((lt) => {
                    const active = value === lt.key;
                    return (
                        <TouchableOpacity
                            key={lt.key}
                            activeOpacity={0.85}
                            style={s.item}
                            onPress={() => onChange(active ? null : lt.key)}
                        >
                            <View style={[s.iconBox, active && s.iconBoxActive]}>
                                <MaterialCommunityIcons name={lt.icon} size={28} color={active ? '#2D3FE0' : '#8F95B2'} />
                            </View>
                            <Text style={[s.itemLabel, active && s.itemLabelActive]}>{lt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

const s = StyleSheet.create({
    block:        { gap: 16, marginBottom: 4 },
    label:        { color: '#8F95B2', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    item:         { width: '45%', alignItems: 'center', gap: 10 },
    iconBox:      { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F1F3FF', alignItems: 'center', justifyContent: 'center' },
    iconBoxActive:{ backgroundColor: '#E8EDFF' },
    itemLabel:    { color: '#8F95B2', fontSize: 13, fontWeight: '500' },
    itemLabelActive:{ color: '#2D3FE0', fontWeight: '700' },
});
