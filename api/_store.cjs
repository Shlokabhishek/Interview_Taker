const { getMongoDb, mongoConfigured } = require('./_mongo.cjs');

const memory = (globalThis.__INTERVIEW_PRO_STORE ||= {
  sessions: new Map(), // session:<id> -> session
  candidates: new Map(), // candidate:<id> -> candidate
  sessionByLink: new Map(), // link -> sessionId
  sessionsByInterviewer: new Map(), // interviewerId -> Set(sessionId)
  candidatesBySession: new Map(), // sessionId -> Set(candidateId)
  allCandidates: new Set(), // candidateId
});

const mongoEnabled = () => mongoConfigured();

const withCollection = async (name, fn) => {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    const collection = db.collection(name);
    return await fn(collection);
  } catch (e) {
    return null;
  }
};

const getMemSet = (map, key) => {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
};

const hydrateMemorySessionIndexes = (session) => {
  if (!session?.id) return;
  memory.sessions.set(`session:${session.id}`, session);

  if (session.link) {
    memory.sessionByLink.set(session.link, session.id);
  }

  if (session.interviewerId) {
    getMemSet(memory.sessionsByInterviewer, session.interviewerId).add(session.id);
  }
};

const hydrateMemoryCandidateIndexes = (candidate) => {
  if (!candidate?.id) return;
  memory.candidates.set(`candidate:${candidate.id}`, candidate);
  memory.allCandidates.add(candidate.id);

  if (candidate.sessionId) {
    getMemSet(memory.candidatesBySession, candidate.sessionId).add(candidate.id);
  }
};

const getSessionByLink = async (link) => {
  if (!link) return null;

  const mongoSession = await withCollection('sessions', (collection) => {
    return collection.findOne({ link }, { projection: { _id: 0 } });
  });

  if (mongoSession) {
    hydrateMemorySessionIndexes(mongoSession);
    return mongoSession;
  }

  const sessionId = memory.sessionByLink.get(link);
  if (!sessionId) return null;
  return memory.sessions.get(`session:${sessionId}`) || null;
};

const putSession = async (session) => {
  if (!session?.id) return null;

  hydrateMemorySessionIndexes(session);

  if (mongoEnabled()) {
    await withCollection('sessions', (collection) => {
      return collection.updateOne({ id: session.id }, { $set: session }, { upsert: true });
    });
  }

  return session;
};

const listSessions = async (interviewerId) => {
  if (!interviewerId) return [];

  const mongoSessions = await withCollection('sessions', (collection) => {
    return collection.find({ interviewerId }, { projection: { _id: 0 } }).toArray();
  });

  if (Array.isArray(mongoSessions)) {
    mongoSessions.forEach(hydrateMemorySessionIndexes);
    return mongoSessions;
  }

  const ids = Array.from(memory.sessionsByInterviewer.get(interviewerId) || []);
  if (!ids.length) return [];

  return ids
    .map((id) => memory.sessions.get(`session:${id}`))
    .filter(Boolean);
};

const patchSession = async (id, updates) => {
  if (!id) return null;

  const timestampedUpdates = {
    ...(updates || {}),
    updatedAt: new Date().toISOString(),
  };

  if (mongoEnabled()) {
    const updated = await withCollection('sessions', async (collection) => {
      const existing = await collection.findOne({ id }, { projection: { _id: 0 } });
      if (!existing) return null;

      const next = { ...existing, ...timestampedUpdates };
      await collection.updateOne({ id }, { $set: next }, { upsert: true });
      return next;
    });

    if (updated) {
      hydrateMemorySessionIndexes(updated);
      return updated;
    }
  }

  const existing = memory.sessions.get(`session:${id}`);
  if (!existing) return null;

  const next = { ...existing, ...timestampedUpdates };
  hydrateMemorySessionIndexes(next);
  return next;
};

const deleteSession = async (id) => {
  if (!id) return false;

  const memoryExisting = memory.sessions.get(`session:${id}`) || null;

  let mongoExisting = null;
  if (mongoEnabled()) {
    mongoExisting = await withCollection('sessions', async (collection) => {
      const existing = await collection.findOne({ id }, { projection: { _id: 0 } });
      if (!existing) return null;
      await collection.deleteOne({ id });
      return existing;
    });

    await withCollection('candidates', (collection) => {
      return collection.deleteMany({ sessionId: id });
    });
  }

  const existing = mongoExisting || memoryExisting;
  if (!existing) return false;

  memory.sessions.delete(`session:${id}`);

  if (existing.link) {
    memory.sessionByLink.delete(existing.link);
  }

  if (existing.interviewerId) {
    memory.sessionsByInterviewer.get(existing.interviewerId)?.delete(existing.id);
  }

  const candidateIds = Array.from(memory.candidatesBySession.get(id) || []);
  candidateIds.forEach((candidateId) => {
    memory.candidates.delete(`candidate:${candidateId}`);
    memory.allCandidates.delete(candidateId);
  });
  memory.candidatesBySession.delete(id);

  return true;
};

const putCandidate = async (candidate) => {
  if (!candidate?.id) return null;

  hydrateMemoryCandidateIndexes(candidate);

  if (mongoEnabled()) {
    await withCollection('candidates', (collection) => {
      return collection.updateOne({ id: candidate.id }, { $set: candidate }, { upsert: true });
    });
  }

  return candidate;
};

const listCandidates = async (sessionId) => {
  const mongoCandidates = await withCollection('candidates', (collection) => {
    const query = sessionId ? { sessionId } : {};
    return collection.find(query, { projection: { _id: 0 } }).toArray();
  });

  if (Array.isArray(mongoCandidates)) {
    mongoCandidates.forEach(hydrateMemoryCandidateIndexes);
    return mongoCandidates;
  }

  const ids = sessionId
    ? Array.from(memory.candidatesBySession.get(sessionId) || [])
    : Array.from(memory.allCandidates);

  if (!ids.length) return [];

  return ids
    .map((id) => memory.candidates.get(`candidate:${id}`))
    .filter(Boolean);
};

const patchCandidate = async (id, updates) => {
  if (!id) return null;

  if (mongoEnabled()) {
    const updated = await withCollection('candidates', async (collection) => {
      const existing = await collection.findOne({ id }, { projection: { _id: 0 } });
      if (!existing) return null;

      const next = { ...existing, ...(updates || {}) };
      await collection.updateOne({ id }, { $set: next }, { upsert: true });
      return next;
    });

    if (updated) {
      hydrateMemoryCandidateIndexes(updated);
      return updated;
    }
  }

  const existing = memory.candidates.get(`candidate:${id}`);
  if (!existing) return null;

  const next = { ...existing, ...(updates || {}) };
  hydrateMemoryCandidateIndexes(next);
  return next;
};

module.exports = {
  kvEnabled: mongoEnabled,
  mongoEnabled,
  getSessionByLink,
  putSession,
  listSessions,
  patchSession,
  deleteSession,
  putCandidate,
  listCandidates,
  patchCandidate,
};
