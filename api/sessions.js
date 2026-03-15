const { setCors, readBodyJson, sendJson } = require('./_utils.cjs');
const { putSession, listSessions, patchSession, deleteSession } = require('./_store.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET') {
    const interviewerId = url.searchParams.get('interviewerId');
    const sessions = await listSessions(interviewerId);
    sendJson(res, 200, sessions);
    return;
  }

  if (req.method === 'POST') {
    const session = await readBodyJson(req);
    if (!session?.id) {
      sendJson(res, 400, { error: 'Missing session id' });
      return;
    }
    await putSession(session);
    sendJson(res, 200, session);
    return;
  }

  if (req.method === 'PATCH') {
    const id = url.searchParams.get('id');
    if (!id) {
      sendJson(res, 400, { error: 'Missing id' });
      return;
    }
    const updates = await readBodyJson(req);
    const next = await patchSession(id, updates);
    if (!next) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    sendJson(res, 200, next);
    return;
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) {
      sendJson(res, 400, { error: 'Missing id' });
      return;
    }
    const ok = await deleteSession(id);
    if (!ok) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
};

