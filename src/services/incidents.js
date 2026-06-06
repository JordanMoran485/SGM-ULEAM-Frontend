import { buildApiUrl, buildStorageUrl, fetchJson } from './api';

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
  Pendiente: 'Pendiente',
  'En Proceso': 'En progreso',
  Completada: 'Completada',
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

function getPersonName(rawUser, fallback = 'Sin asignar') {
  return firstDefined(
    rawUser?.name && rawUser?.lastname ? `${rawUser.name} ${rawUser.lastname}`.trim() : null,
    rawUser?.name,
    fallback
  );
}

function getImage(rawItem) {
  return buildStorageUrl(
    firstDefined(
      rawItem?.image_url,
      rawItem?.photo_url,
      rawItem?.image,
      rawItem?.photo,
      rawItem?.image_path,
      rawItem?.photo_path,
      rawItem?.attachment,
      rawItem?.file,
      rawItem?.evidence,
      rawItem?.evidence_url
    )
  );
}

function normalizeTask(rawTask) {
  const status = getStatusKey(rawTask?.status);
  const image = getImage(rawTask);

  return {
    id: firstDefined(rawTask?.id, rawTask?.task_id),
    title: firstDefined(rawTask?.title, 'Tarea sin titulo'),
    description: firstDefined(rawTask?.description, ''),
    location: firstDefined(rawTask?.location, 'Sin ubicacion'),
    status,
    statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
    image,
    createdAt: firstDefined(rawTask?.created_at, rawTask?.createdAt),
    updatedAt: firstDefined(rawTask?.updated_at, rawTask?.updatedAt),
    startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
    endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
    allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
    assignedCleanerName: getPersonName(rawTask?.user),
    assignedCleanerRole: 'Conserje asignado',
    priority: firstDefined(rawTask?.priority, 'Media'),
    dueDate: firstDefined(rawTask?.due_date, rawTask?.dueDate),
    userId: firstDefined(rawTask?.user_id, rawTask?.userId),
    incidentId: firstDefined(rawTask?.incident_id, rawTask?.incidentId),
  };
}

function normalizeIncident(rawIncident) {
  const status = getStatusKey(rawIncident?.status);
  const image = getImage(rawIncident);
  const tasks = asArray(rawIncident?.tasks).map(normalizeTask);
  const latestTask = tasks[0] || null;

  return {
    id: firstDefined(rawIncident?.id, rawIncident?.incident_id),
    title: firstDefined(rawIncident?.title, 'Incidencia sin titulo'),
    description: firstDefined(rawIncident?.description, ''),
    location: firstDefined(rawIncident?.location, 'Sin ubicacion'),
    status,
    statusLabel: STATUS_LABELS[rawIncident?.status] || STATUS_LABELS[status] || 'Pendiente',
    image,
    createdAt: firstDefined(rawIncident?.created_at, rawIncident?.createdAt),
    updatedAt: firstDefined(rawIncident?.updated_at, rawIncident?.updatedAt),
    startAt: latestTask?.startAt || null,
    endAt: latestTask?.endAt || null,
    allDay: Boolean(latestTask?.allDay),
    assignedCleanerName: latestTask?.assignedCleanerName || 'Sin asignar',
    assignedCleanerRole: 'Conserje asignado',
    tasks,
    tasksCount: firstDefined(rawIncident?.tasks_count, tasks.length, 0),
    latestTask,
    priority: firstDefined(rawIncident?.priority, latestTask?.priority, 'Media'),
    category: firstDefined(rawIncident?.category, ''),
    dueDate: latestTask?.dueDate || null,
    userId: firstDefined(rawIncident?.user_id, rawIncident?.userId),
    reporterName: getPersonName(rawIncident?.user, 'Sin reportante'),
    approvalStatus: firstDefined(rawIncident?.review_status, rawIncident?.reviewStatus, 'Pendiente de revision'),
    reviewNotes: firstDefined(rawIncident?.review_notes, rawIncident?.reviewNotes, ''),
    reviewedAt: firstDefined(rawIncident?.reviewed_at, rawIncident?.reviewedAt),
    reviewedByName: getPersonName(rawIncident?.reviewer, 'Sin revisor'),
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

export async function getIncidents(token) {
  const data = await fetchJson('/api/incidents', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return asArray(data).map(normalizeIncident);
}

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value);
  }
}

function buildUploadFile(image) {
  if (!image?.uri) return null;
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
  appendIfPresent(formData, 'category', payload?.category);
  appendIfPresent(formData, 'status', payload?.status || 'pending');

  const uploadFile = buildUploadFile(payload?.image);
  if (uploadFile) formData.append('image', uploadFile);

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
