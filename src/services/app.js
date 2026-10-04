import { v4 as uuidv4 } from 'uuid';

// Generate unique IDs
export const generateId = () => uuidv4();

// Generate interview link
export const generateInterviewLink = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format duration in mm:ss
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate score color
export const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  if (score >= 40) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

// Calculate score grade
export const getScoreGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Storage utilities
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

const trimTrailingSlash = (value) => `${value || ''}`.trim().replace(/\/+$/, '');

const isPrivateIpv4Host = (host) => {
  if (!host) return false;
  if (host === 'localhost') return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;

  const match = host.match(/^172\.(\d{1,3})\./);
  if (!match) return false;

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const inferLocalApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';

  const { protocol, hostname } = window.location;
  if (!hostname) return '';

  if (protocol === 'http:' && isPrivateIpv4Host(hostname)) {
    return `http://${hostname}:8787`;
  }

  return '';
};

// Public base URL for share links (useful when running on LAN IP instead of localhost)
export const getPublicBaseUrl = () => {
  try {
    const envBase = import.meta?.env?.VITE_PUBLIC_BASE_URL;
    const storedBase = storage.get('publicBaseUrl');
    const raw = envBase || storedBase || window.location.origin || '';
    return trimTrailingSlash(raw);
  } catch (e) {
    return '';
  }
};

// Optional backend API base URL (when you run a server so candidates work across devices)
export const getApiBaseUrl = () => {
  try {
    const envBase = import.meta?.env?.VITE_API_BASE_URL;
    const storedBase = storage.get('apiBaseUrl');
    const localDefaultBase = import.meta?.env?.DEV
      ? inferLocalApiBaseUrl() || 'http://localhost:8787'
      : inferLocalApiBaseUrl();
    const raw = envBase || storedBase || localDefaultBase || '';

    if (import.meta?.env?.PROD) {
      // In deployed environments, default to same-origin serverless API unless explicitly configured.
      if (!envBase && !storedBase && !localDefaultBase) return '/api';
    }

    if (!raw) return '';

    return trimTrailingSlash(raw);
  } catch (e) {
    return import.meta?.env?.PROD ? '/api' : '';
  }
};

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

    storage.remove('apiBaseUrl');
    return fallbackResult;
  }
};

// Question types
export const QUESTION_TYPES = {
  TECHNICAL: 'technical',
  SKILL_SPECIFIC: 'skill_specific',
  BEHAVIORAL: 'behavioral',
  SITUATIONAL: 'situational',
  HR: 'hr',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.TECHNICAL]: 'Technical',
  [QUESTION_TYPES.SKILL_SPECIFIC]: 'Skill Specific',
  [QUESTION_TYPES.BEHAVIORAL]: 'Behavioral',
  [QUESTION_TYPES.SITUATIONAL]: 'Situational',
  [QUESTION_TYPES.HR]: 'HR/General',
};

export const QUESTION_TYPE_COLORS = {
  [QUESTION_TYPES.TECHNICAL]: 'bg-blue-100 text-blue-700',
  [QUESTION_TYPES.SKILL_SPECIFIC]: 'bg-cyan-100 text-cyan-700',
  [QUESTION_TYPES.BEHAVIORAL]: 'bg-purple-100 text-purple-700',
  [QUESTION_TYPES.SITUATIONAL]: 'bg-green-100 text-green-700',
  [QUESTION_TYPES.HR]: 'bg-orange-100 text-orange-700',
};
