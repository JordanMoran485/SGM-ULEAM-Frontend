import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/context/AppContext';

function NotificationNavigator() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateFromNotificationData(router, data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateFromNotificationData(router, data);
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);

  return null;
}

function navigateFromNotificationData(router: ReturnType<typeof useRouter>, data: Record<string, unknown>) {
  const taskId     = data?.task_id     as string | undefined;
  const incidentId = data?.incident_id as string | undefined;
  const type       = data?.type        as string | undefined;

  if (incidentId && type === 'incident') {
    router.push({ pathname: '/IncidentDetail', params: { id: incidentId, type: 'incident' } });
  } else if (taskId) {
    router.push({ pathname: '/IncidentDetail', params: { id: taskId, type: 'task' } });
  } else if (incidentId) {
    router.push({ pathname: '/IncidentDetail', params: { id: incidentId, type: 'incident' } });
  }
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NavBar = require('expo-navigation-bar');
      NavBar.setVisibilityAsync('visible');
      NavBar.setBackgroundColorAsync('#ffffff');
      NavBar.setButtonStyleAsync('dark');
    } catch {
      // módulo no disponible en Expo Go — funciona en build nativo
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* <Stack.Screen name="Login" />
            <Stack.Screen name="Register" /> */}
          </Stack>
          <NotificationNavigator />
        </PaperProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
