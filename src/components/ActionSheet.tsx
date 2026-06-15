import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal, StyleSheet, Text, TouchableOpacity,
  TouchableWithoutFeedback, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ActionSheetOption {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {title && <Text style={styles.sheetTitle}>{title}</Text>}

        {options.map((opt, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.option}
              onPress={() => { onClose(); setTimeout(opt.onPress, 150); }}
            >
              <View style={[styles.optionIcon, opt.destructive && styles.optionIconDestructive]}>
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={20}
                  color={opt.destructive ? '#F43F5E' : '#4A6CF7'}
                />
              </View>
              <Text style={[styles.optionLabel, opt.destructive && styles.optionLabelDestructive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}

        <View style={styles.cancelDivider} />

        <TouchableOpacity activeOpacity={0.85} style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,31,54,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  sheetTitle: {
    color: '#8F95B2',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F3FF',
    marginHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDestructive: {
    backgroundColor: '#FFE4E8',
  },
  optionLabel: {
    color: '#1A1F36',
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabelDestructive: {
    color: '#F43F5E',
  },
  cancelDivider: {
    height: 8,
    backgroundColor: '#F5F7FF',
    marginTop: 8,
  },
  cancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    color: '#8F95B2',
    fontSize: 15,
    fontWeight: '600',
  },
});
