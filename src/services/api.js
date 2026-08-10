import Constants from 'expo-constants';

const FALLBACK_API_PORT = '8000';
const LOCALHOST_API_BASE_URL = `http://127.0.0.1:${FALLBACK_API_PORT}`;
const DEFAULT_NETWORK_ERROR_MESSAGE = 'No hay conexión con el servidor.';
const DEFAULT_SERVER_ERROR_MESSAGE = 'El servidor no pudo procesar la solicitud.';

function removeTrailingSlash(value) {
  return typeof value === 'string' ? value.replace(/\/+$/, '') : '';
}

function stripUrlFromMessage(message) {
  if (typeof message !== 'string') {
    return '';
  }

  return message
    .replace(/\s*\(https?:\/\/[^\s)]+\)/gi, '')
    .replace(/\s*at\s+https?:\/\/[^\s)]+/gi, '')
    .replace(/\s*https?:\/\/[^\s)]+/gi, '')
    .trim();
}

export function sanitizeApiErrorMessage(message, fallback = DEFAULT_SERVER_ERROR_MESSAGE) {
  const cleaned = stripUrlFromMessage(message);
  return cleaned || fallback;
}

/**
 * Errores por campo de una respuesta 422 de Laravel: { campo: [mensajes] }.
 * getApiErrorMessage solo devuelve un string, asi que el detalle por campo se
 * perdia y el formulario nunca marcaba en rojo el campo culpable.
 *
 * @returns {Record<string, string> | null} un mensaje por campo, o null.
 */
export function getFieldErrors(error) {
  if (error?.status !== 422) {
    return null;
  }

  const errors = error?.data?.errors;

  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const flattened = Object.entries(errors).reduce((accumulator, [field, messages]) => {
    const message = Array.isArray(messages) ? messages[0] : messages;

    if (typeof message === 'string' && message) {
      accumulator[field] = message;
    }

    return accumulator;
  }, {});

  return Object.keys(flattened).length > 0 ? flattened : null;
}

export function isUnauthorized(error) {
  return error?.status === 401;
}

export function getApiErrorMessage(error) {
  if (!error) {
    return DEFAULT_NETWORK_ERROR_MESSAGE;
  }

  if (error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (error.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (error.status === 404) {
    return 'El recurso solicitado no fue encontrado.';
  }

  if (error.status === 422) {
    return sanitizeApiErrorMessage(error?.data?.message, 'Hay campos inválidos en el formulario.');
  }

  if (error.status) {
    return sanitizeApiErrorMessage(error?.message, `Error del servidor (${error.status}).`);
  }

  return sanitizeApiErrorMessage(error?.message, DEFAULT_NETWORK_ERROR_MESSAGE);
}

function extractHostCandidate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/^https?:\/\//, '');
  const host = normalized.split('/')[0]?.split(':')[0];

  return host || null;
}

function getExpoHost() {
  return extractHostCandidate(
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.linkingUri
  );
}

function getConfiguredApiBaseUrl() {
  // 1) Variable de entorno (Expo inyecta process.env.EXPO_PUBLIC_* en el bundle).
  const envBaseUrl = removeTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL);

  if (envBaseUrl) {
    return envBaseUrl;
  }

  // 2) Valor inyectado vía app.config.js / app.json (extra.apiBaseUrl).
  const expoExtraBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const manifestBaseUrl = Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl;
  const configuredBaseUrl = removeTrailingSlash(expoExtraBaseUrl || manifestBaseUrl);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  // 3) Autodetección del host de Expo (desarrollo) o localhost.

  const expoHost = getExpoHost();

  if (expoHost) {
    return `http://${expoHost}:${FALLBACK_API_PORT}`;
  }

  return LOCALHOST_API_BASE_URL;
}

export const API_BASE_URL = getConfiguredApiBaseUrl();
export const STORAGE_BASE_URL = `${API_BASE_URL}/storage`;

export function buildApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function isAbsoluteStorageUrl(value) {
  return typeof value === 'string' && /^(https?:\/\/|\/\/|data:)/i.test(value);
}

export function buildStorageUrl(path = '') {
  if (!path) {
    return null;
  }

  if (typeof path === 'string' && isAbsoluteStorageUrl(path)) {
    return path;
  }

  const normalizedPath = String(path)
    .trim()
    .replace(/^\/+/, '')
    .replace(/^storage\/+/i, '');

  return normalizedPath ? `${STORAGE_BASE_URL}/${normalizedPath}` : null;
}

// El servidor de desarrollo puede devolver respuestas vacías o truncadas bajo
// peticiones concurrentes; coercer eso a [] haría que las pantallas vacíen sus
// listas. Se lanza error para que el caller conserve el estado anterior.
export function requireJsonList(data, resourceLabel) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : null;

  if (!list) {
    const error = new Error(`Respuesta inválida del servidor al cargar ${resourceLabel}.`);
    error.data = data;
    throw error;
  }

  return list;
}

// `php artisan serve` en Windows atiende una petición a la vez; bajo
// concurrencia puede responder 200 con cuerpo vacío. Un reintento corto
// suele bastar para obtener la lista real.
export async function fetchJsonList(path, options, resourceLabel, retries = 1) {
  for (;;) {
    const data = await fetchJson(path, options);

    try {
      return requireJsonList(data, resourceLabel);
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}

export async function fetchJson(path, options = {}) {
  const url = buildApiUrl(path);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
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
        sanitizeApiErrorMessage(
          (typeof data === 'object' ? data?.message : null),
          `Error del servidor (${response.status}).`
        )
      );
      error.status = response.status;
      error.data = data;
      error.url = url;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.url) {
      error.url = url;
    }

    error.message = getApiErrorMessage(error);

    throw error;
  }
}
