import Constants from 'expo-constants';

const FALLBACK_API_PORT = '8000';
const LOCALHOST_API_BASE_URL = `http://127.0.0.1:${FALLBACK_API_PORT}`;

function removeTrailingSlash(value) {
  return typeof value === 'string' ? value.replace(/\/+$/, '') : '';
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
  const expoExtraBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const manifestBaseUrl = Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl;
  const configuredBaseUrl = removeTrailingSlash(expoExtraBaseUrl || manifestBaseUrl);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

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

export function buildStorageUrl(path = '') {
  if (!path) {
    return null;
  }

  if (typeof path === 'string' && path.startsWith('http')) {
    return path;
  }

  const normalizedPath = String(path)
    .replace(/^\/+/, '')
    .replace(/^storage\/+/i, '');
  return `${STORAGE_BASE_URL}/${normalizedPath}`;
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
        (typeof data === 'object' ? data?.message : null) ||
        `Request failed with status ${response.status} at ${url}`
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

    if (!error.message?.includes(url)) {
      error.message = `${error.message} (${url})`;
    }

    throw error;
  }
}
