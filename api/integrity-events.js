const phoneLike = (frame) => Boolean(frame && Number(frame.confidence) >= 0.62 && frame.boundingBox);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const frames = Array.isArray(body.frames) ? body.frames : [];
  const serverEvents = frames.filter(phoneLike).map((frame) => ({
    type: 'phone_detected',
    confidence: Math.min(0.99, Number(frame.confidence) + 0.08),
    timestamp: frame.timestamp || new Date().toISOString(),
    source: 'server_reverification',
    boundingBox: frame.boundingBox,
  }));
  const clientEvents = Array.isArray(body.events) ? body.events : [];
  const clientPhoneCount = clientEvents.filter((event) => event?.type === 'phone_detected').length;
  const discrepancy = serverEvents.length > clientPhoneCount ? Math.min(1, (serverEvents.length - clientPhoneCount) / 3) : 0;

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ serverEvents, discrepancy, retainedRawFrames: false, processedAt: new Date().toISOString() }));
};
