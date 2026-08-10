import { buildApiUrl, buildStorageUrl, fetchJsonList } from './api';

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

function getImages(rawItem) {
  const img1 = getImage(rawItem);
  const img2 = buildStorageUrl(firstDefined(rawItem?.image2_url, rawItem?.image2));
  return [img1, img2].filter(Boolean);
}


function lightNormalizeTask(rawTask) {
  const status = getStatusKey(rawTask?.status);
  return {
    id: firstDefined(rawTask?.id, rawTask?.task_id),
    title: firstDefined(rawTask?.title, 'Tarea sin titulo'),
    description: firstDefined(rawTask?.description, ''),
    status,
    statusLabel: STATUS_LABELS[rawTask?.status] || STATUS_LABELS[status] || 'Pendiente',
    assignedCleanerName: getPersonName(rawTask?.user, 'Sin asignar'),
    startAt: firstDefined(rawTask?.start_at, rawTask?.startAt),
    endAt: firstDefined(rawTask?.end_at, rawTask?.endAt),
    allDay: Boolean(firstDefined(rawTask?.all_day, rawTask?.allDay, false)),
    priority: firstDefined(rawTask?.priority, 'Media'),
    dueDate: firstDefined(rawTask?.due_date, rawTask?.dueDate),
  };
}

function normalizeIncident(rawIncident) {
  const status = getStatusKey(rawIncident?.status);
  const image = getImage(rawIncident);
  const tasks = asArray(rawIncident?.tasks).map(lightNormalizeTask);
  const latestTask = tasks[0] || null;

  return {
    id: firstDefined(rawIncident?.id, rawIncident?.incident_id),
    title: firstDefined(rawIncident?.title, 'Incidencia sin titulo'),
    description: firstDefined(rawIncident?.description, ''),
    location: firstDefined(rawIncident?.location, 'Sin ubicacion'),
    status,
    statusLabel: STATUS_LABELS[rawIncident?.status] || STATUS_LABELS[status] || 'Pendiente',
    image,
    images: getImages(rawIncident),
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
  const list = await fetchJsonList('/api/incidents', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }, 'las incidencias');

  return list.map(normalizeIncident);
}

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value);
  }
}

// El backend solo acepta jpeg/jpg/png/webp y un maximo de 5 MB por imagen.
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getExtension(image) {
  const fromName = image?.fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1];
  const fromUri = image?.uri?.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1];

  return (fromName || fromUri || 'jpg').toLowerCase();
}

/**
 * Valida una foto contra las reglas del backend ANTES de gastar la subida.
 * Devuelve null si es valida, o el mensaje de error a mostrar.
 */
export function validateImage(image) {
  if (!image?.uri) return null;

  const extension = getExtension(image);

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return `Formato .${extension} no admitido. Usa JPG, PNG o WEBP.`;
  }

  if (typeof image.fileSize === 'number' && image.fileSize > MAX_IMAGE_BYTES) {
    const mb = (image.fileSize / (1024 * 1024)).toFixed(1);
    return `La foto pesa ${mb} MB y el maximo es 5 MB.`;
  }

  return null;
}

function buildUploadFile(image) {
  if (!image?.uri) return null;

  const extension = getExtension(image);
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;

  // Se prioriza el MIME derivado de la extension: en Android el picker a veces
  // entrega mimeType generico o ausente y Laravel rechaza la regla `mimes`.
  const type = MIME_BY_EXTENSION[extension] || image.mimeType || image.type || 'image/jpeg';

  const name = /\.[a-zA-Z0-9]+$/.test(image.fileName || '')
    ? image.fileName
    : `incident-${Date.now()}.${normalizedExtension}`;

  return { uri: image.uri, name, type };
}

function appendImageFields(formData, image, image2) {
  const primaryFile = buildUploadFile(image);
  const secondaryFile = buildUploadFile(image2);

  // Solo 'image' e 'image2': son los unicos campos que lee el backend. Antes se
  // adjuntaba el mismo fichero tambien como 'photo' y 'file', triplicando los
  // bytes subidos desde el movil sin ningun efecto en el servidor.
  if (primaryFile) {
    formData.append('image', primaryFile);
  }

  if (secondaryFile) {
    formData.append('image2', secondaryFile);
  }
}

export function createIncident(token, payload, onProgress) {
  return new Promise((resolve, reject) => {
    // Sin token el backend responde 401 seguro: se corta antes de subir las fotos.
    if (!token) {
      const error = new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      error.status = 401;
      reject(error);
      return;
    }

    const formData = new FormData();

    appendIfPresent(formData, 'title', payload?.title);
    appendIfPresent(formData, 'description', payload?.description);
    appendIfPresent(formData, 'location', payload?.location);
    appendIfPresent(formData, 'priority', payload?.priority);

    appendImageFields(formData, payload?.image, payload?.image2);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildApiUrl('/api/incidents'));
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      let data = null;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch (_) {}
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const error = new Error(
          (typeof data === 'object' ? data?.message : null) ||
          `Request failed with status ${xhr.status}`
        );
        error.status = xhr.status;
        error.data = data;
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al subir la incidencia.'));
    xhr.send(formData);
  });
}
