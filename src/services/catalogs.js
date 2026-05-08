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
  const [facultadesResponse, carrerasResponse] = await Promise.all([
    fetchJson('/api/facultades'),
    fetchJson('/api/carreras'),
  ]);

  const facultades = asArray(facultadesResponse).map((item) => ({
    label: item.name,
    value: String(item.id),
  }));

  const carreras = asArray(carrerasResponse).map((item) => ({
    label: item.name,
    value: String(item.id),
    facultadId: String(item.facultad_id),
  }));

  return { facultades, carreras };
}
