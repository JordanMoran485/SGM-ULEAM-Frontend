// Configuración dinámica de Expo: extiende app.json e inyecta la URL del
// backend Laravel desde la variable de entorno EXPO_PUBLIC_API_BASE_URL.
//
// Orden de prioridad para la URL del API:
//   1. EXPO_PUBLIC_API_BASE_URL (definida en .env o en el perfil de eas.json)
//   2. extra.apiBaseUrl heredado de app.json (si lo hubiera)
//   3. DEFAULT_API_BASE_URL (desarrollo local)
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

export default ({ config }) => {
  const apiBaseUrl =
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ||
    normalizeBaseUrl(config.extra?.apiBaseUrl) ||
    DEFAULT_API_BASE_URL;

  return {
    ...config,
    extra: {
      ...config.extra,
      apiBaseUrl,
    },
  };
};
