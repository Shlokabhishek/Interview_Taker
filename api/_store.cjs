let kv = null;
try {
  // Optional dependency for persistent storage on Vercel.
  kv = require('@vercel/kv').kv;
} catch (e) {}

const memory = (globalThis.__INTERVIEW_PRO_STORE ||= {
  sessions: new Map(), // session:<id> -> session
  candidates: new Map(), // candidate:<id> -> candidate
  sessionByLink: new Map(), // link -> sessionId
  sessionsByInterviewer: new Map(), // interviewerId -> Set(sessionId)
  candidatesBySession: new Map(), // sessionId -> Set(candidateId)
  allCandidates: new Set(), // candidateId
});

const kvEnabled = () => Boolean(kv);

const getMemSet = (map, key) => {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
};

const getJson = async (key) => {
  if (kvEnabled()) return kv.get(key);
  if (key.startsWith('session:')) return memory.sessions.get(key) || null;
  if (key.startsWith('candidate:')) return memory.candidates.get(key) || null;
  return null;
};

const setJson = async (key, value) => {
  if (kvEnabled()) return kv.set(key, value);
  if (key.startsWith('session:')) memory.sessions.set(key, value);
  if (key.startsWith('candidate:')) memory.candidates.set(key, value);
};

const delKey = async (key) => {
  if (kvEnabled()) return kv.del(key);
  memory.sessions.delete(key);
  memory.candidates.delete(key);
};

const getSessionByLink = async (link) => {
  if (!link) return null;
  const sessionId = kvEnabled()
    ? await kv.get(`sessionByLink:${link}`)
    : memory.sessionByLink.get(link);
  if (!sessionId) return null;
  return getJson(`session:${sessionId}`);
};

const putSession = async (session) => {
  const sessionKey = `session:${session.id}`;
  await setJson(sessionKey, session);

  if (session.link) {
    if (kvEnabled()) await kv.set(`sessionByLink:${session.link}`, session.id);
    else memory.sessionByLink.set(session.link, session.id);
  }

  if (session.interviewerId) {
    if (kvEnabled()) await kv.sadd(`sessionsByInterviewer:${session.interviewerId}`, session.id);
    else getMemSet(memory.sessionsByInterviewer, session.interviewerId).add(session.id);
  }

  return session;
};

const listSessions = async (interviewerId) => {
  if (!interviewerId) return [];

  const ids = kvEnabled()
    ? await kv.smembers(`sessionsByInterviewer:${interviewerId}`)
    : Array.from(memory.sessionsByInterviewer.get(interviewerId) || []);

  if (!ids.length) return [];

  const keys = ids.map((id) => `session:${id}`);
  const sessions = kvEnabled() ? await kv.mget(...keys) : keys.map((k) => memory.sessions.get(k));
  return (sessions || []).filter(Boolean);
};

const patchSession = async (id, updates) => {
  const existing = await getJson(`session:${id}`);
  if (!existing) return null;
  const next = { ...existing, ...(updates || {}), updatedAt: new Date().toISOString() };
  await putSession(next);
  return next;
};

const deleteSession = async (id) => {
  const existing = await getJson(`session:${id}`);
  if (!existing) return false;

  await delKey(`session:${id}`);

  if (existing.link) {
    if (kvEnabled()) await kv.del(`sessionByLink:${existing.link}`);
    else memory.sessionByLink.delete(existing.link);
  }

  if (existing.interviewerId) {
    if (kvEnabled()) await kv.srem(`sessionsByInterviewer:${existing.interviewerId}`, existing.id);
    else memory.sessionsByInterviewer.get(existing.interviewerId)?.delete(existing.id);
  }

  return true;
};

const putCandidate = async (candidate) => {
  const key = `candidate:${candidate.id}`;
  await setJson(key, candidate);

  if (kvEnabled()) await kv.sadd('allCandidates', candidate.id);
  else memory.allCandidates.add(candidate.id);

  if (candidate.sessionId) {
    if (kvEnabled()) await kv.sadd(`candidatesBySession:${candidate.sessionId}`, candidate.id);
    else getMemSet(memory.candidatesBySession, candidate.sessionId).add(candidate.id);
  }

  return candidate;
};

const listCandidates = async (sessionId) => {
  const ids = sessionId
    ? (kvEnabled()
        ? await kv.smembers(`candidatesBySession:${sessionId}`)
        : Array.from(memory.candidatesBySession.get(sessionId) || []))
    : (kvEnabled()
        ? await kv.smembers('allCandidates')
        : Array.from(memory.allCandidates));

  if (!ids.length) return [];

  const keys = ids.map((id) => `candidate:${id}`);
  const candidates = kvEnabled() ? await kv.mget(...keys) : keys.map((k) => memory.candidates.get(k));
  return (candidates || []).filter(Boolean);
};

const patchCandidate = async (id, updates) => {
  const existing = await getJson(`candidate:${id}`);
  if (!existing) return null;
  const next = { ...existing, ...(updates || {}) };
  await putCandidate(next);
  return next;
};

module.exports = {
  kvEnabled,
  getSessionByLink,
  putSession,
  listSessions,
  patchSession,
  deleteSession,
  putCandidate,
  listCandidates,
  patchCandidate,
};

