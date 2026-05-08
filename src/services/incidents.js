import { buildStorageUrl, fetchJson } from './api';

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
  'Pendiente': 'Pendiente',
  'En Proceso': 'En progreso',
  'Completada': 'Completada',
};

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
  return values.find(
    (value) => value !== undefined && value !== null && value !== '' && value !== 'null'
  );
}

function getStatusKey(status) {
  const normalized = firstDefined(status, 'pending');

  if (normalized === 'Pendiente') {
    return 'pending';
  }

  if (normalized === 'En Proceso') {
    return 'in_progress';
  }

  if (normalized === 'Completada') {
    return 'completed';
  }

  return normalized;
}

function getTaskResponsibleName(rawTask) {
  return firstDefined(
    rawTask?.user?.name && rawTask?.user?.lastname
      ? `${rawTask.user.name} ${rawTask.user.lastname}`.trim()
      : null,
    rawTask?.user?.name,
    rawTask?.assigned_to_name,
    rawTask?.cleaner_name,
    rawTask?.concierge_name,
    rawTask?.janitor_name,
    rawTask?.responsible_name,
    rawTask?.responsable,
    rawTask?.user_id ? `Usuario #${rawTask.user_id}` : null,
    'Sin asignar'
  );
}

function normalizeTaskAsIncident(rawTask) {
  const status = getStatusKey(rawTask?.status);

  return {
    id: firstDefined(rawTask?.id, rawTask?.task_id),
    title: firstDefined(rawTask?.title, 'Tarea sin título'),
    description: firstDefined(rawTask?.description, ''),
    location: firstDefined(rawTask?.location, 'Sin ubicación'),
    status,
    statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
    image: buildStorageUrl(firstDefined(rawTask?.image, rawTask?.photo, rawTask?.image_url)),
    createdAt: firstDefined(rawTask?.created_at, rawTask?.createdAt),
    updatedAt: firstDefined(rawTask?.updated_at, rawTask?.updatedAt),
    assignedCleanerName: getTaskResponsibleName(rawTask),
    assignedCleanerRole: 'Conserje asignado',
    tasks: [
      {
        id: firstDefined(rawTask?.id, rawTask?.task_id),
        title: firstDefined(rawTask?.title, 'Tarea asignada'),
        description: firstDefined(rawTask?.description, ''),
        status,
        statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
        area: firstDefined(rawTask?.location, null),
        assignedCleanerName: getTaskResponsibleName(rawTask),
      },
    ],
    tasksCount: 1,
    latestTask: {
      id: firstDefined(rawTask?.id, rawTask?.task_id),
      title: firstDefined(rawTask?.title, 'Tarea asignada'),
      description: firstDefined(rawTask?.description, ''),
      status,
      statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
      area: firstDefined(rawTask?.location, null),
      assignedCleanerName: getTaskResponsibleName(rawTask),
    },
    priority: firstDefined(rawTask?.priority, 'Media'),
    dueDate: firstDefined(rawTask?.due_date, rawTask?.dueDate),
    userId: firstDefined(rawTask?.user_id, rawTask?.userId),
  };
}

export function buildIncidentStats(incidents) {
  return incidents.reduce(
    (accumulator, incident) => {
      if (incident.status === 'pending') {
        accumulator.pending += 1;
      } else if (incident.status === 'in_progress') {
        accumulator.inProgress += 1;
      } else if (incident.status === 'completed' || incident.status === 'resolved') {
        accumulator.completed += 1;
      }

      accumulator.total += 1;
      return accumulator;
    },
    { total: 0, pending: 0, inProgress: 0, completed: 0 }
  );
}

async function fetchTasksCollection(token) {
  const candidateEndpoints = [
    '/api/tasks',
    '/api/incidents',
  ];

  let lastError = null;

  for (const endpoint of candidateEndpoints) {
    try {
      return await fetchJson(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function getIncidents(token) {
  const data = await fetchTasksCollection(token);
  return asArray(data).map(normalizeTaskAsIncident);
}
