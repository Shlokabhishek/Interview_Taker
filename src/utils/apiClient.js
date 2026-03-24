import { getApiBaseUrl, storage } from './helpers';

const buildUrl = (base, path) => `${base}${path.startsWith('/') ? '' : '/'}${path}`;

const fetchJson = async (url, options) => {
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

export const apiFetchJson = async (path, options = {}) => {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');

  try {
    return await fetchJson(buildUrl(base, path), options);
  } catch (error) {
    const canFallbackToSameOriginApi =
      import.meta?.env?.PROD &&
      base !== '/api' &&
      /^https?:\/\//i.test(base);

    if (!canFallbackToSameOriginApi) {
      throw error;
    }

    const fallbackResult = await fetchJson(buildUrl('/api', path), options);

    // Clear stale custom API base so future requests keep using the working same-origin /api.
    storage.remove('apiBaseUrl');
    return fallbackResult;
  }
};

