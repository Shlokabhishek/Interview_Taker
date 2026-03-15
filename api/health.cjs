const { setCors, sendJson } = require('./_utils.cjs');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  sendJson(res, 200, { ok: true });
};

