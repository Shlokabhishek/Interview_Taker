import { getApiBaseUrl, apiFetchJson } from './app';

export const INTEGRITY_CONFIG = {
  phone: { confidenceCutoff: 0.58, scanIntervalMs: 1500, cooldownMs: 5000 },
  gaze: { sampleIntervalMs: 1500, downwardAngleDeg: 22, sustainedWindowMs: 8000, minSamples: 4 },
  audio: { sampleIntervalMs: 1000, speechEnergyFloor: 0.035, silenceMs: 3500 },
  server: { sampleIntervalMs: 12000, batchIntervalMs: 7000 },
  weights: { phone_detected: 0.48, gaze_anomaly: 0.28, audio_anomaly: 0.16, tamper_suspicion: 0.08 },
};

export const INTEGRITY_LIMITATIONS = 'Integrity signals are probabilistic and support human review only. A candidate can keep a phone out of frame or use another device; no single signal is an automatic rejection.';

export const createIntegritySession = (candidateId, sessionId, consent) => ({
  id: `integrity-${candidateId}-${Date.now()}`,
  candidateId,
  sessionId,
  startedAt: new Date().toISOString(),
  consent: { ...consent, recordedAt: new Date().toISOString() },
  events: [],
  serverEvents: [],
  status: 'review_pending',
});

export const calculateIntegrityScore = (events = [], serverEvents = []) => {
  const grouped = events.reduce((acc, event) => {
    if (event?.type) acc[event.type] = (acc[event.type] || 0) + Math.max(0, Math.min(1, Number(event.confidence) || 0));
    return acc;
  }, {});
  const serverPhone = serverEvents.filter((event) => event?.type === 'phone_detected').length;
  const clientPhone = events.filter((event) => event?.type === 'phone_detected').length;
  const discrepancy = serverPhone > clientPhone ? Math.min(1, (serverPhone - clientPhone) / 3) : 0;
  const risk = Object.entries(INTEGRITY_CONFIG.weights).reduce((sum, [type, weight]) => sum + (grouped[type] || 0) * weight, 0) + discrepancy * INTEGRITY_CONFIG.weights.tamper_suspicion;
  return { score: Math.max(0, Math.round(100 - Math.min(1, risk) * 100)), risk: Number(Math.min(1, risk).toFixed(3)), tamperSuspicion: Number(discrepancy.toFixed(3)), evidenceCount: events.length + serverEvents.length };
};

export const uploadIntegrityEvents = async (payload) => {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;
  try {
    return await apiFetchJson('/integrity/events', { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    return null;
  }
};
