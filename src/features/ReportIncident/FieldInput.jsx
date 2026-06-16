import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function FieldInput({ label, value, onChangeText, placeholder, multiline, error, focused, onFocus, onBlur }) {
    return (
        <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{label}</Text>
            <TextInput
                style={[s.input, multiline && s.inputMultiline, focused && s.inputFocused, error && s.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#C4C9E2"
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {!!error && (
                <View style={s.errorRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#F43F5E" />
                    <Text style={s.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    fieldWrap:      { marginBottom: 16, gap: 6 },
    fieldLabel:     { color: '#8F95B2', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    input:          { backgroundColor: '#F8F9FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8EDFF', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#1A1F36', fontWeight: '500' },
    inputMultiline: { minHeight: 120, paddingTop: 13 },
    inputFocused:   { borderColor: '#4A6CF7', backgroundColor: '#ffffff' },
    inputError:     { borderColor: '#F43F5E' },
    errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
    errorText:      { color: '#F43F5E', fontSize: 12, fontWeight: '600' },
});
