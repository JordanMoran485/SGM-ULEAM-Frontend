import { fetchJson } from './api';

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeNotification(rawNotification) {
  const data = rawNotification?.data || {};

  return {
    id: rawNotification?.id,
    title: firstDefined(data?.title, 'Notificacion'),
    body: firstDefined(data?.body, ''),
    incidentId: firstDefined(data?.incident_id, data?.incidentId, null),
    taskId: firstDefined(data?.task_id, data?.taskId, null),
    location: firstDefined(data?.location, 'Sin ubicacion'),
    priority: firstDefined(data?.priority, 'Media'),
    status: firstDefined(data?.status, 'Pendiente'),
    notificationType: firstDefined(data?.notification_type, null),
    readAt: firstDefined(rawNotification?.read_at, rawNotification?.readAt, null),
    createdAt: firstDefined(rawNotification?.created_at, rawNotification?.createdAt, null),
    isRead: Boolean(firstDefined(rawNotification?.read_at, rawNotification?.readAt, null)),
  };
}

export async function getNotifications(token) {
  const data = await fetchJson('/api/notifications', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return asArray(data).map(normalizeNotification);
}

export async function markNotificationAsRead(token, notificationId) {
  return fetchJson(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
