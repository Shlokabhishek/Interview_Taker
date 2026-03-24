import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');
const MONGODB_URI = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
const MONGODB_DB = (process.env.MONGODB_DB || process.env.MONGO_DB_NAME || 'ai_interview_platform').trim();

let mongoConnectPromise = null;

const getMongoDb = async () => {
  if (!MONGODB_URI) return null;
  if (mongoConnectPromise) return mongoConnectPromise;

  mongoConnectPromise = MongoClient.connect(MONGODB_URI)
    .then((client) => client.db(MONGODB_DB))
    .catch(() => {
      mongoConnectPromise = null;
      return null;
    });

  return mongoConnectPromise;
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return null;
  return JSON.parse(raw);
};

const ensureDb = async () => {
  try {
    await fs.access(DB_PATH);
  } catch (e) {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify({ sessions: [], candidates: [] }, null, 2));
  }
};

const readDb = async () => {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
  };
};

const writeDb = async (db) => {
  await ensureDb();
  const tmpPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(db, null, 2));
  await fs.rename(tmpPath, DB_PATH);
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { ...headers });
  res.end(body);
};

const sendJson = (res, status, obj) => {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
};

const setCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const notFound = (res) => sendJson(res, 404, { error: 'Not found' });

const getSessions = async (interviewerId) => {
  const db = await getMongoDb();
  if (db) {
    const query = interviewerId ? { interviewerId } : {};
    return db.collection('sessions').find(query, { projection: { _id: 0 } }).toArray();
  }

  const local = await readDb();
  return interviewerId
    ? local.sessions.filter((s) => s?.interviewerId === interviewerId)
    : local.sessions;
};

const getSessionByLink = async (link) => {
  const db = await getMongoDb();
  if (db) {
    return db.collection('sessions').findOne({ link }, { projection: { _id: 0 } });
  }

  const local = await readDb();
  return local.sessions.find((s) => s?.link === link) || null;
};

const upsertSession = async (session) => {
  const db = await getMongoDb();
  if (db) {
    await db.collection('sessions').updateOne({ id: session.id }, { $set: session }, { upsert: true });
    return session;
  }

  const local = await readDb();
  const idx = local.sessions.findIndex((s) => s?.id === session.id);
  if (idx === -1) local.sessions.push(session);
  else local.sessions[idx] = session;
  await writeDb(local);
  return session;
};

const patchSession = async (id, updates) => {
  const db = await getMongoDb();
  if (db) {
    const existing = await db.collection('sessions').findOne({ id }, { projection: { _id: 0 } });
    if (!existing) return null;
    const next = { ...existing, ...(updates || {}), updatedAt: new Date().toISOString() };
    await db.collection('sessions').updateOne({ id }, { $set: next }, { upsert: true });
    return next;
  }

  const local = await readDb();
  const idx = local.sessions.findIndex((s) => s?.id === id);
  if (idx === -1) return null;
  local.sessions[idx] = { ...local.sessions[idx], ...(updates || {}), updatedAt: new Date().toISOString() };
  await writeDb(local);
  return local.sessions[idx];
};

const deleteSessionCascade = async (id) => {
  const db = await getMongoDb();
  if (db) {
    const deleted = await db.collection('sessions').deleteOne({ id });
    if (!deleted?.deletedCount) return false;
    await db.collection('candidates').deleteMany({ sessionId: id });
    return true;
  }

  const local = await readDb();
  const before = local.sessions.length;
  local.sessions = local.sessions.filter((s) => s?.id !== id);
  if (local.sessions.length === before) return false;
  local.candidates = local.candidates.filter((c) => c?.sessionId !== id);
  await writeDb(local);
  return true;
};

const getCandidates = async (sessionId) => {
  const db = await getMongoDb();
  if (db) {
    const query = sessionId ? { sessionId } : {};
    return db.collection('candidates').find(query, { projection: { _id: 0 } }).toArray();
  }

  const local = await readDb();
  return sessionId
    ? local.candidates.filter((c) => c?.sessionId === sessionId)
    : local.candidates;
};

const upsertCandidate = async (candidate) => {
  const db = await getMongoDb();
  if (db) {
    await db.collection('candidates').updateOne({ id: candidate.id }, { $set: candidate }, { upsert: true });
    return candidate;
  }

  const local = await readDb();
  const idx = local.candidates.findIndex((c) => c?.id === candidate.id);
  if (idx === -1) local.candidates.push(candidate);
  else local.candidates[idx] = candidate;
  await writeDb(local);
  return candidate;
};

const patchCandidate = async (id, updates) => {
  const db = await getMongoDb();
  if (db) {
    const existing = await db.collection('candidates').findOne({ id }, { projection: { _id: 0 } });
    if (!existing) return null;
    const next = { ...existing, ...(updates || {}) };
    await db.collection('candidates').updateOne({ id }, { $set: next }, { upsert: true });
    return next;
  }

  const local = await readDb();
  const idx = local.candidates.findIndex((c) => c?.id === id);
  if (idx === -1) return null;
  local.candidates[idx] = { ...local.candidates[idx], ...(updates || {}) };
  await writeDb(local);
  return local.candidates[idx];
};

const server = http.createServer(async (req, res) => {
  try {
    setCors(req, res);
    if (req.method === 'OPTIONS') {
      send(res, 204, '');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname.startsWith('/api/') ? url.pathname.slice(4) : url.pathname;

    if (req.method === 'GET' && pathname === '/health') {
      const mongo = Boolean(await getMongoDb());
      sendJson(res, 200, { ok: true, mongo, storage: mongo ? 'mongodb' : 'json' });
      return;
    }

    if (req.method === 'GET' && pathname === '/sessions') {
      const interviewerId = url.searchParams.get('interviewerId');
      const sessions = await getSessions(interviewerId);
      sendJson(res, 200, sessions);
      return;
    }

    if (req.method === 'GET' && pathname === '/session-by-link') {
      const link = url.searchParams.get('link') || '';
      const session = await getSessionByLink(link);
      if (!session) {
        sendJson(res, 404, { error: 'Session not found' });
        return;
      }
      sendJson(res, 200, session);
      return;
    }

    if (req.method === 'POST' && pathname === '/sessions') {
      const body = await readJsonBody(req);
      if (!body?.id) {
        sendJson(res, 400, { error: 'Missing session id' });
        return;
      }
      await upsertSession(body);
      sendJson(res, 200, body);
      return;
    }

    if (pathname === '/sessions' && url.searchParams.get('id')) {
      const sessionId = url.searchParams.get('id');

      if (req.method === 'PATCH') {
        const updates = await readJsonBody(req);
        const next = await patchSession(sessionId, updates);
        if (!next) {
          sendJson(res, 404, { error: 'Session not found' });
          return;
        }
        sendJson(res, 200, next);
        return;
      }

      if (req.method === 'DELETE') {
        const ok = await deleteSessionCascade(sessionId);
        if (!ok) {
          sendJson(res, 404, { error: 'Session not found' });
          return;
        }
        sendJson(res, 200, { ok: true });
        return;
      }
    }

    if (req.method === 'GET' && pathname === '/candidates') {
      const sessionId = url.searchParams.get('sessionId');
      const candidates = await getCandidates(sessionId);
      sendJson(res, 200, candidates);
      return;
    }

    if (req.method === 'POST' && pathname === '/candidates') {
      const body = await readJsonBody(req);
      if (!body?.id) {
        sendJson(res, 400, { error: 'Missing candidate id' });
        return;
      }
      await upsertCandidate(body);
      sendJson(res, 200, body);
      return;
    }

    if (pathname === '/candidates' && url.searchParams.get('id')) {
      const candidateId = url.searchParams.get('id');
      if (req.method === 'PATCH') {
        const updates = await readJsonBody(req);
        const next = await patchCandidate(candidateId, updates);
        if (!next) {
          sendJson(res, 404, { error: 'Candidate not found' });
          return;
        }
        sendJson(res, 200, next);
        return;
      }
    }

    notFound(res);
  } catch (err) {
    sendJson(res, 500, { error: err?.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${PORT}`);
});
