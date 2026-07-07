import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (data: ToastData) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const TYPE_CONF = {
  success: { stripe: '#22C55E', iconBg: '#DCFCE7', iconColor: '#22C55E', icon: 'check-circle-outline' },
  error:   { stripe: '#F43F5E', iconBg: '#FFE4E8', iconColor: '#F43F5E', icon: 'alert-circle-outline' },
  info:    { stripe: '#4A6CF7', iconBg: '#E8EDFF', iconColor: '#4A6CF7', icon: 'information-outline'  },
  warning: { stripe: '#F59E0B', iconBg: '#FEF3C7', iconColor: '#F59E0B', icon: 'alert-outline'        },
} as const;

function sanitizeToastText(value: string | undefined) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\s*\(https?:\/\/[^\s)]+\)/gi, '')
    .replace(/\s*https?:\/\/[^\s)]+/gi, '')
    .trim();
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ToastData>({ type: 'info', title: '' });
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [translateY, opacity]);

  const show = useCallback((toastData: ToastData) => {
    if (timer.current) clearTimeout(timer.current);
    setData({
      ...toastData,
      title: sanitizeToastText(toastData.title) || toastData.title,
      message: sanitizeToastText(toastData.message),
    });
    setVisible(true);
    translateY.setValue(-100);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, toastData.duration ?? 3500);
  }, [translateY, opacity, hide]);

  const success = useCallback((title: string, message?: string) => show({ type: 'success', title, message }), [show]);
  const error   = useCallback((title: string, message?: string) => show({ type: 'error',   title, message }), [show]);
  const info    = useCallback((title: string, message?: string) => show({ type: 'info',    title, message }), [show]);
  const warning = useCallback((title: string, message?: string) => show({ type: 'warning', title, message }), [show]);

  const conf = TYPE_CONF[data.type];

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      <View style={{ flex: 1 }}>
        {children}
        {visible && (
          <Animated.View
            pointerEvents="box-none"
            style={[styles.wrapper, { top: insets.top + 10, transform: [{ translateY }], opacity }]}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={hide} style={styles.toast}>
              <View style={[styles.stripe, { backgroundColor: conf.stripe }]} />
              <View style={[styles.iconBox, { backgroundColor: conf.iconBg }]}>
                <MaterialCommunityIcons name={conf.icon as any} size={20} color={conf.iconColor} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
                {data.message ? (
                  <Text style={styles.message} numberOfLines={2}>{data.message}</Text>
                ) : null}
              </View>
              <MaterialCommunityIcons name="close" size={16} color="#8F95B2" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider.');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 14,
    gap: 12,
    shadowColor: '#4A6CF7',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#1A1F36',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    color: '#8F95B2',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
