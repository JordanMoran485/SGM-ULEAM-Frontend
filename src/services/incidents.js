import { buildApiUrl, buildStorageUrl, fetchJson } from './api';

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

function getTaskImage(rawTask) {
  return buildStorageUrl(
    firstDefined(
      rawTask?.image_url,
      rawTask?.photo_url,
      rawTask?.image,
      rawTask?.photo,
      rawTask?.image_path,
      rawTask?.photo_path,
      rawTask?.attachment,
      rawTask?.file,
      rawTask?.evidence,
      rawTask?.evidence_url
    )
  );
}

function normalizeTaskAsIncident(rawTask) {
  const status = getStatusKey(rawTask?.status);
  const image = getTaskImage(rawTask);

  return {
    id: firstDefined(rawTask?.id, rawTask?.task_id),
    title: firstDefined(rawTask?.title, 'Tarea sin título'),
    description: firstDefined(rawTask?.description, ''),
    location: firstDefined(rawTask?.location, 'Sin ubicación'),
    status,
    statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
    image,
    createdAt: firstDefined(rawTask?.created_at, rawTask?.createdAt),
    updatedAt: firstDefined(rawTask?.updated_at, rawTask?.updatedAt),
    startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
    endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
    allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
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
          image,
          startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
          endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
          allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
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
        image,
        startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
        endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
        allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
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

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value);
  }
}

function buildUploadFile(image) {
  if (!image?.uri) {
    return null;
  }

  const uri = image.uri;
  const extensionMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
  const type = image.mimeType || image.type || `image/${normalizedExtension}`;

  return {
    uri,
    name: image.fileName || `incident-${Date.now()}.${normalizedExtension}`,
    type,
  };
}

export async function createIncident(token, payload) {
  const formData = new FormData();

  appendIfPresent(formData, 'title', payload?.title);
  appendIfPresent(formData, 'description', payload?.description);
  appendIfPresent(formData, 'location', payload?.location);
  appendIfPresent(formData, 'status', payload?.status || 'pending');

  const uploadFile = buildUploadFile(payload?.image);

  if (uploadFile) {
    formData.append('image', uploadFile);
  }

  const response = await fetch(buildApiUrl('/api/incidents'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (_error) {
    data = responseText;
  }

  if (!response.ok) {
    const error = new Error(
      (typeof data === 'object' ? data?.message : null) ||
      `Request failed with status ${response.status} at ${buildApiUrl('/api/incidents')}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
