const { setCors, sendJson } = require('./_utils.cjs');
const { kvEnabled } = require('./_store.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  const kv = kvEnabled();
  sendJson(res, 200, { ok: true, kv, storage: kv ? 'kv' : 'memory' });
};
