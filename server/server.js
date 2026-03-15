import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

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
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json' });
};

const setCors = (req, res) => {
  // For hackathon/demo use. Lock this down in production.
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const notFound = (res) => sendJson(res, 404, { error: 'Not found' });

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
      sendJson(res, 200, { ok: true });
      return;
    }

    // Sessions
    if (req.method === 'GET' && pathname === '/sessions') {
      const db = await readDb();
      const interviewerId = url.searchParams.get('interviewerId');
      const sessions = interviewerId
        ? db.sessions.filter((s) => s?.interviewerId === interviewerId)
        : db.sessions;
      sendJson(res, 200, sessions);
      return;
    }

    if (req.method === 'GET' && pathname === '/session-by-link') {
      const link = url.searchParams.get('link') || '';
      const db = await readDb();
      const session = db.sessions.find((s) => s?.link === link);
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
      const db = await readDb();
      const idx = db.sessions.findIndex((s) => s?.id === body.id);
      if (idx === -1) db.sessions.push(body);
      else db.sessions[idx] = body;
      await writeDb(db);
      sendJson(res, 200, body);
      return;
    }

    if (pathname === '/sessions' && url.searchParams.get('id')) {
      const sessionId = url.searchParams.get('id');
      if (req.method === 'PATCH') {
        const updates = await readJsonBody(req);
        const db = await readDb();
        const idx = db.sessions.findIndex((s) => s?.id === sessionId);
        if (idx === -1) {
          sendJson(res, 404, { error: 'Session not found' });
          return;
        }
        db.sessions[idx] = { ...db.sessions[idx], ...(updates || {}), updatedAt: new Date().toISOString() };
        await writeDb(db);
        sendJson(res, 200, db.sessions[idx]);
        return;
      }

      if (req.method === 'DELETE') {
        const db = await readDb();
        const before = db.sessions.length;
        db.sessions = db.sessions.filter((s) => s?.id !== sessionId);
        if (db.sessions.length === before) {
          sendJson(res, 404, { error: 'Session not found' });
          return;
        }
        // Also remove candidates for that session
        db.candidates = db.candidates.filter((c) => c?.sessionId !== sessionId);
        await writeDb(db);
        sendJson(res, 200, { ok: true });
        return;
      }
    }

    // Candidates
    if (req.method === 'GET' && pathname === '/candidates') {
      const db = await readDb();
      const sessionId = url.searchParams.get('sessionId');
      const candidates = sessionId
        ? db.candidates.filter((c) => c?.sessionId === sessionId)
        : db.candidates;
      sendJson(res, 200, candidates);
      return;
    }

    if (req.method === 'POST' && pathname === '/candidates') {
      const body = await readJsonBody(req);
      if (!body?.id) {
        sendJson(res, 400, { error: 'Missing candidate id' });
        return;
      }
      const db = await readDb();
      const idx = db.candidates.findIndex((c) => c?.id === body.id);
      if (idx === -1) db.candidates.push(body);
      else db.candidates[idx] = body;
      await writeDb(db);
      sendJson(res, 200, body);
      return;
    }

    if (pathname === '/candidates' && url.searchParams.get('id')) {
      const candidateId = url.searchParams.get('id');
      if (req.method === 'PATCH') {
        const updates = await readJsonBody(req);
        const db = await readDb();
        const idx = db.candidates.findIndex((c) => c?.id === candidateId);
        if (idx === -1) {
          sendJson(res, 404, { error: 'Candidate not found' });
          return;
        }
        db.candidates[idx] = { ...db.candidates[idx], ...(updates || {}) };
        await writeDb(db);
        sendJson(res, 200, db.candidates[idx]);
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
