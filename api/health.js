const { setCors, sendJson } = require('./_utils.cjs');
const { mongoEnabled } = require('./_store.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  const mongo = mongoEnabled();
  sendJson(res, 200, { ok: true, mongo, storage: mongo ? 'mongodb' : 'memory' });
};
