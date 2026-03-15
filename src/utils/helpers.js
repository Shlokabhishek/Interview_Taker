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

// Public base URL for share links (useful when running on LAN IP instead of localhost)
export const getPublicBaseUrl = () => {
  try {
    const envBase = import.meta?.env?.VITE_PUBLIC_BASE_URL;
    const storedBase = storage.get('publicBaseUrl');
    const raw = (envBase || storedBase || window.location.origin || '').trim();
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
  } catch (e) {
    return '';
  }
};

// Optional backend API base URL (when you run a server so candidates work across devices)
export const getApiBaseUrl = () => {
  try {
    const envBase = import.meta?.env?.VITE_API_BASE_URL;
    const storedBase = storage.get('apiBaseUrl');
    const raw = (envBase || storedBase || '').trim();
    if (!raw) return import.meta?.env?.PROD ? '/api' : '';
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
  } catch (e) {
    return import.meta?.env?.PROD ? '/api' : '';
  }
};

// Question types
export const QUESTION_TYPES = {
  TECHNICAL: 'technical',
  BEHAVIORAL: 'behavioral',
  SITUATIONAL: 'situational',
  HR: 'hr',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.TECHNICAL]: 'Technical',
  [QUESTION_TYPES.BEHAVIORAL]: 'Behavioral',
  [QUESTION_TYPES.SITUATIONAL]: 'Situational',
  [QUESTION_TYPES.HR]: 'HR/General',
};

export const QUESTION_TYPE_COLORS = {
  [QUESTION_TYPES.TECHNICAL]: 'bg-blue-100 text-blue-700',
  [QUESTION_TYPES.BEHAVIORAL]: 'bg-purple-100 text-purple-700',
  [QUESTION_TYPES.SITUATIONAL]: 'bg-green-100 text-green-700',
  [QUESTION_TYPES.HR]: 'bg-orange-100 text-orange-700',
};
