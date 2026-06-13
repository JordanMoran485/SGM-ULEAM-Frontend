import { buildStorageUrl, fetchJson, fetchJsonList } from './api';

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  Pendiente: 'Pendiente',
  'En Proceso': 'En progreso',
  Completada: 'Completada',
};

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== '' && value !== 'null'
  );
}

function getStatusKey(status) {
  if (status === 'Pendiente') {
    return 'pending';
  }

  if (status === 'En Proceso') {
    return 'in_progress';
  }

  if (status === 'Completada') {
    return 'completed';
  }

  return firstDefined(status, 'pending');
}

function getImage(rawTask) {
  return buildStorageUrl(firstDefined(rawTask?.image_url, rawTask?.image));
}

function getAssignedName(rawTask) {
  return firstDefined(
    rawTask?.user?.name && rawTask?.user?.lastname
      ? `${rawTask.user.name} ${rawTask.user.lastname}`.trim()
      : null,
    rawTask?.user?.name,
    'Sin asignar'
  );
}

function normalizeTask(rawTask) {
  const status = getStatusKey(rawTask?.status);

  return {
    id: firstDefined(rawTask?.id, rawTask?.task_id),
    title: firstDefined(rawTask?.title, 'Tarea sin titulo'),
    description: firstDefined(rawTask?.description, ''),
    location: firstDefined(rawTask?.location, 'Sin ubicacion'),
    status,
    statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
    image: getImage(rawTask),
    createdAt: firstDefined(rawTask?.created_at, rawTask?.createdAt),
    updatedAt: firstDefined(rawTask?.updated_at, rawTask?.updatedAt),
    startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
    endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
    allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
    assignedCleanerName: getAssignedName(rawTask),
    assignedCleanerRole: 'Conserje asignado',
    priority: firstDefined(rawTask?.priority, 'Media'),
    dueDate: firstDefined(rawTask?.due_date, rawTask?.dueDate),
    userId: firstDefined(rawTask?.user_id, rawTask?.userId),
    incidentId: firstDefined(rawTask?.incident_id, rawTask?.incidentId),
    tasks: [
      {
        id: firstDefined(rawTask?.id, rawTask?.task_id),
        title: firstDefined(rawTask?.title, 'Tarea asignada'),
        description: firstDefined(rawTask?.description, ''),
        status,
        statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
        assignedCleanerName: getAssignedName(rawTask),
        image: getImage(rawTask),
      },
    ],
    tasksCount: 1,
    latestTask: null,
  };
}

export async function getTasks(token) {
  const list = await fetchJsonList('/api/tasks', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }, 'las tareas');

  return list.map(normalizeTask);
}

export async function updateTaskStatus(token, taskId, status) {
  const data = await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ status }),
  });

  return normalizeTask(data?.data || data);
}
