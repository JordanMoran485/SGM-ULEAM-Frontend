import React, { useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';

function formatNotificationDate(value) {
  if (!value) {
    return 'Ahora mismo';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    notificationsLoaded,
    refreshNotifications,
    markNotificationRead,
    tasks,
    incidents,
    refreshTasks,
    refreshIncidents,
    isLoading,
  } = useAppContext();

  useEffect(() => {
    if (!notificationsLoaded) {
      refreshNotifications().catch((error) => {
        console.error('Error al cargar notificaciones:', error);
        Alert.alert('Error', error?.message || 'No se pudieron cargar las notificaciones.');
      });
    }
  }, [notificationsLoaded, refreshNotifications]);

  const handleOpen = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
      }

      if (notification.taskId) {
        const hasTaskLoaded = tasks.some(
          (item) => String(item.id) === String(notification.taskId)
        );

        if (!hasTaskLoaded) {
          await refreshTasks();
        }
      }

      if (notification.incidentId) {
        const hasIncidentLoaded = incidents.some(
          (item) => String(item.id) === String(notification.incidentId)
        );

        if (!hasIncidentLoaded) {
          await refreshIncidents();
        }
      }
    } catch (error) {
      console.error('Error al preparar la notificacion:', error);
    }

    if (notification.taskId) {
      router.push({
        pathname: '/IncidentDetail',
        params: { id: String(notification.taskId), type: 'task' },
      });

      return;
    }

    if (notification.incidentId) {
      router.push({
        pathname: '/IncidentDetail',
        params: { id: String(notification.incidentId), type: 'incident' },
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading && notificationsLoaded} onRefresh={refreshNotifications} />}
    >
      <Stack.Screen options={{ title: 'Notificaciones', headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Bandeja operativa</Text>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>
          Aquí verás cuando un supervisor apruebe una incidencia y te asigne una tarea.
        </Text>
      </View>

      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <TouchableOpacity
            key={String(notification.id)}
            style={[styles.card, !notification.isRead && styles.cardUnread]}
            onPress={() => handleOpen(notification)}
          >
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons
                name={notification.isRead ? 'bell-check-outline' : 'bell-ring-outline'}
                size={24}
                color={notification.isRead ? '#44635a' : '#0f2f29'}
              />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                {!notification.isRead ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.cardText}>{notification.body}</Text>
              <Text style={styles.cardMeta}>
                {notification.location} · Prioridad {notification.priority}
              </Text>
              <Text style={styles.cardDate}>{formatNotificationDate(notification.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>
            Cuando el supervisor apruebe una incidencia asignada a ti, aparecerá aquí.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6f4',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginTop: 54,
    marginBottom: 18,
  },
  eyebrow: {
    color: '#6b7d78',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    color: '#16211e',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64746f',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e5e0',
    marginBottom: 12,
  },
  cardUnread: {
    borderColor: '#b9d3cb',
    backgroundColor: '#f8fcfa',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e4efeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    color: '#16211e',
    fontSize: 16,
    fontWeight: '800',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1d8f60',
  },
  cardText: {
    color: '#40514c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    color: '#0f2f29',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDate: {
    color: '#6b7d78',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d9e5e0',
  },
  emptyTitle: {
    color: '#16211e',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: '#687974',
    fontSize: 14,
    lineHeight: 21,
  },
});
