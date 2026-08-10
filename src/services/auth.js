import { buildApiUrl, buildStorageUrl, fetchJson, sanitizeApiErrorMessage } from './api';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return user;
  }

  return {
    ...user,
    profile_photo_url: buildStorageUrl(
      firstDefined(user.profile_photo_url, user.profile_photo_path)
    ),
  };
}

export function extractAuthPayload(result) {
  const token = firstDefined(
    result?.token,
    result?.access_token,
    result?.plainTextToken,
    result?.data?.token,
    result?.data?.access_token,
    result?.data?.plainTextToken
  );

  const rawUser = firstDefined(
    result?.user,
    result?.data?.user,
    result?.data
  );

  const user = normalizeUser(rawUser);

  return { user, token };
}

/**
 * Usuario autenticado con datos frescos del servidor.
 *
 * profile_photo_url es una URL firmada que caduca (60 min por defecto), asi que
 * la copia guardada en el dispositivo deja de servir. Al arrancar la app se
 * renueva desde aqui; un 401 significa que el token ya no es valido.
 */
export async function getMe(token) {
  const data = await fetchJson('/api/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return normalizeUser(firstDefined(data?.user, data));
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
    name: image.fileName || `profile-${Date.now()}.${normalizedExtension}`,
    type,
  };
}

export async function uploadProfileImage(token, image) {
  const uploadFile = buildUploadFile(image);

  if (!uploadFile) {
    throw new Error('No se encontró una imagen válida para subir.');
  }

  const formData = new FormData();
  formData.append('image', uploadFile);

  const response = await fetch(buildApiUrl('/api/profile/image'), {
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
      sanitizeApiErrorMessage(
        typeof data === 'object' ? data?.message : null,
        `Error del servidor (${response.status}).`
      )
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  const user = data?.user
    ? normalizeUser({
        ...data.user,
        profile_photo_url: firstDefined(data.user.profile_photo_url, data.user.profile_photo_path, data.url),
      })
    : null;

  return {
    ...data,
    user,
    url: buildStorageUrl(firstDefined(data?.url, user?.profile_photo_url)),
  };
}
