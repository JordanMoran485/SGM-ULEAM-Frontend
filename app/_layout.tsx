import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
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

  if (taskId) {
    router.push({ pathname: '/IncidentDetail', params: { id: taskId, type: 'task' } });
  } else if (incidentId) {
    router.push({ pathname: '/IncidentDetail', params: { id: incidentId, type: type || 'incident' } });
  }
}

export default function RootLayout() {
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
