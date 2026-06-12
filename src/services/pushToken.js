import { fetchJson } from './api';

export async function savePushToken(authToken, pushToken, platform) {
  return fetchJson('/api/push-token', {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: JSON.stringify({ token: pushToken, platform }),
  });
}
