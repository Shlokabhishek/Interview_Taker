const { setCors, sendJson } = require('./_utils.cjs');
const { getSessionByLink, kvEnabled } = require('./_store.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!kvEnabled()) {
    // Still works in-memory, but not persistent across cold starts.
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const link = url.searchParams.get('link');
  if (!link) {
    sendJson(res, 400, { error: 'Missing link' });
    return;
  }

  const session = await getSessionByLink(link);
  if (!session) {
    sendJson(res, 404, { error: 'Session not found' });
    return;
  }

  sendJson(res, 200, session);
};

