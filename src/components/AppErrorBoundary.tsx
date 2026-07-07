import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class AppErrorBoundaryInner extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error no controlado en la app:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <FallbackScreen error={this.state.error} onRetry={this.reset} />;
    }

    return this.props.children;
  }
}

function FallbackScreen({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <LinearGradient
        colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBadge}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#FFFFFF" />
      </LinearGradient>

      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.subtitle}>
        La app encontró un error inesperado. Puedes intentar de nuevo sin perder el contexto general.
      </Text>

      {error?.message ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>Detalle técnico</Text>
          <Text style={styles.errorText} numberOfLines={4}>
            {error.message}
          </Text>
        </View>
      ) : null}

      <Pressable onPress={onRetry} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
        <Text style={styles.primaryButtonText}>Reintentar</Text>
      </Pressable>

      <Text style={styles.footer}>
        Si el problema persiste, vuelve a abrir la app o revisa tu conexión.
      </Text>
    </View>
  );
}

export default function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <AppErrorBoundaryInner>
      {children}
    </AppErrorBoundaryInner>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(74,108,247,0.10)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(45,63,224,0.08)',
  },
  iconBadge: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2D3FE0',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    color: '#1A1F36',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#5B6485',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
    maxWidth: 340,
  },
  errorBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDFF',
    marginBottom: 18,
  },
  errorLabel: {
    color: '#8F95B2',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  errorText: {
    color: '#1A1F36',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    minWidth: 180,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2D3FE0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D3FE0',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    color: '#8F95B2',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 320,
  },
});
