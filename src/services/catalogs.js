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

export async function getRegistrationCatalogs() {
  const facultadesResponse = await fetchJson('/api/facultades');

  const facultades = asArray(facultadesResponse).map((item) => ({
    label: item.code ? `${item.code} - ${item.name}` : item.name,
    value: String(item.id),
  }));

  return { facultades };
}
