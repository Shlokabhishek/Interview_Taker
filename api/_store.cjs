let kv = null;
let kvLoadPromise = null;

const kvConfigured = () => Boolean(
  process?.env?.KV_REST_API_URL &&
  (process?.env?.KV_REST_API_TOKEN || process?.env?.KV_REST_API_READ_ONLY_TOKEN)
);

const loadKv = async () => {
  if (kv) return kv;
  if (kvLoadPromise) return kvLoadPromise;

  kvLoadPromise = import('@vercel/kv')
    .then((mod) => mod?.kv || mod?.default?.kv || mod?.default || null)
    .catch(() => null)
    .then((client) => {
      kv = client;
      return kv;
    });

  return kvLoadPromise;
};

const memory = (globalThis.__INTERVIEW_PRO_STORE ||= {
  sessions: new Map(), // session:<id> -> session
  candidates: new Map(), // candidate:<id> -> candidate
  sessionByLink: new Map(), // link -> sessionId
  sessionsByInterviewer: new Map(), // interviewerId -> Set(sessionId)
  candidatesBySession: new Map(), // sessionId -> Set(candidateId)
  allCandidates: new Set(), // candidateId
});

const kvEnabled = () => kvConfigured();

const kvOp = async (fn) => {
  if (!kvConfigured()) return null;
  const client = await loadKv();
  if (!client) return null;

  try {
    return await fn(client);
  } catch (e) {
    return null;
  }
};

const getMemSet = (map, key) => {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
};

const getJson = async (key) => {
  if (kvEnabled()) {
    const value = await kvOp((client) => client.get(key));
    if (value !== null && value !== undefined) return value;
  }
  if (key.startsWith('session:')) return memory.sessions.get(key) || null;
  if (key.startsWith('candidate:')) return memory.candidates.get(key) || null;
  return null;
};

const setJson = async (key, value) => {
  if (key.startsWith('session:')) memory.sessions.set(key, value);
  if (key.startsWith('candidate:')) memory.candidates.set(key, value);
  if (kvEnabled()) {
    await kvOp((client) => client.set(key, value));
  }
};

const delKey = async (key) => {
  memory.sessions.delete(key);
  memory.candidates.delete(key);
  if (kvEnabled()) {
    await kvOp((client) => client.del(key));
  }
};

const getSessionByLink = async (link) => {
  if (!link) return null;

  const sessionId = kvEnabled()
    ? await kvOp((client) => client.get(`sessionByLink:${link}`))
    : null;

  const resolvedSessionId = sessionId || memory.sessionByLink.get(link);

  if (!resolvedSessionId) return null;
  return getJson(`session:${resolvedSessionId}`);
};

const putSession = async (session) => {
  const sessionKey = `session:${session.id}`;
  await setJson(sessionKey, session);

  if (session.link) {
    memory.sessionByLink.set(session.link, session.id);
    if (kvEnabled()) {
      await kvOp((client) => client.set(`sessionByLink:${session.link}`, session.id));
    }
  }

  if (session.interviewerId) {
    getMemSet(memory.sessionsByInterviewer, session.interviewerId).add(session.id);
    if (kvEnabled()) {
      await kvOp((client) => client.sadd(`sessionsByInterviewer:${session.interviewerId}`, session.id));
    }
  }

  return session;
};

const listSessions = async (interviewerId) => {
  if (!interviewerId) return [];

  const kvIds = kvEnabled()
    ? await kvOp((client) => client.smembers(`sessionsByInterviewer:${interviewerId}`))
    : null;

  const ids = Array.isArray(kvIds)
    ? kvIds
    : Array.from(memory.sessionsByInterviewer.get(interviewerId) || []);

  if (!ids.length) return [];

  const keys = ids.map((id) => `session:${id}`);
  const kvSessions = kvEnabled() ? await kvOp((client) => client.mget(...keys)) : null;
  const sessions = Array.isArray(kvSessions) ? kvSessions : keys.map((k) => memory.sessions.get(k));
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
    memory.sessionByLink.delete(existing.link);
    if (kvEnabled()) {
      await kvOp((client) => client.del(`sessionByLink:${existing.link}`));
    }
  }

  if (existing.interviewerId) {
    memory.sessionsByInterviewer.get(existing.interviewerId)?.delete(existing.id);
    if (kvEnabled()) {
      await kvOp((client) => client.srem(`sessionsByInterviewer:${existing.interviewerId}`, existing.id));
    }
  }

  return true;
};

const putCandidate = async (candidate) => {
  const key = `candidate:${candidate.id}`;
  await setJson(key, candidate);

  memory.allCandidates.add(candidate.id);
  if (kvEnabled()) {
    await kvOp((client) => client.sadd('allCandidates', candidate.id));
  }

  if (candidate.sessionId) {
    getMemSet(memory.candidatesBySession, candidate.sessionId).add(candidate.id);
    if (kvEnabled()) {
      await kvOp((client) => client.sadd(`candidatesBySession:${candidate.sessionId}`, candidate.id));
    }
  }

  return candidate;
};

const listCandidates = async (sessionId) => {
  const kvIds = kvEnabled()
    ? await kvOp((client) => client.smembers(sessionId ? `candidatesBySession:${sessionId}` : 'allCandidates'))
    : null;

  const ids = Array.isArray(kvIds)
    ? kvIds
    : sessionId
      ? Array.from(memory.candidatesBySession.get(sessionId) || [])
      : Array.from(memory.allCandidates);

  if (!ids.length) return [];

  const keys = ids.map((id) => `candidate:${id}`);
  const kvCandidates = kvEnabled() ? await kvOp((client) => client.mget(...keys)) : null;
  const candidates = Array.isArray(kvCandidates) ? kvCandidates : keys.map((k) => memory.candidates.get(k));
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
