const { setCors, readBodyJson, sendJson } = require('./_utils.cjs');
const { putCandidate, listCandidates, patchCandidate } = require('./_store.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const candidates = await listCandidates(sessionId);
    sendJson(res, 200, candidates);
    return;
  }

  if (req.method === 'POST') {
    const candidate = await readBodyJson(req);
    if (!candidate?.id) {
      sendJson(res, 400, { error: 'Missing candidate id' });
      return;
    }
    await putCandidate(candidate);
    sendJson(res, 200, candidate);
    return;
  }

  if (req.method === 'PATCH') {
    const id = url.searchParams.get('id');
    if (!id) {
      sendJson(res, 400, { error: 'Missing id' });
      return;
    }
    const updates = await readBodyJson(req);
    const next = await patchCandidate(id, updates);
    if (!next) {
      sendJson(res, 404, { error: 'Candidate not found' });
      return;
    }
    sendJson(res, 200, next);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
};

