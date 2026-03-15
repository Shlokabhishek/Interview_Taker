import { getApiBaseUrl } from './helpers';

export const apiFetchJson = async (path, options = {}) => {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');

  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
};

