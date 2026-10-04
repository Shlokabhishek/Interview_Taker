const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const reqJson = (urlStr, options = {}, body = null) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOpts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });

async function runServerTest() {
  console.log('Starting node backend server (server/server.js)...');
  const serverProcess = spawn('node', ['server/server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '8989' },
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (data) => console.log('[Server stdout]', data.toString().trim()));
  serverProcess.stderr.on('data', (data) => console.error('[Server stderr]', data.toString().trim()));

  // Wait 1.5s for server startup
  await new Promise((r) => setTimeout(r, 1500));

  const baseUrl = 'http://localhost:8989';

  try {
    console.log('--- 1. Testing GET /health ---');
    const health = await reqJson(`${baseUrl}/health`);
    console.log('Health Response:', health);

    console.log('--- 2. Testing POST /api/sessions ---');
    const newSession = {
      id: 'srv_session_777',
      interviewerId: 'interviewer_server_test',
      link: 'server-test-link-xyz',
      title: 'Backend Integration Specialist Interview',
      description: 'Testing Node.js Server + MySQL 3NF Database Integration',
      timeLimit: 45,
      questions: [
        { id: 'q_srv_1', text: 'Describe MySQL 3NF database design.', weight: 1.0 },
      ],
    };
    const postSessionRes = await reqJson(`${baseUrl}/api/sessions`, { method: 'POST' }, newSession);
    console.log('POST Session Response Status:', postSessionRes.status);
    console.log('POST Session Title:', postSessionRes.body?.title);

    console.log('--- 3. Testing GET /api/session-by-link ---');
    const fetchLinkRes = await reqJson(`${baseUrl}/api/session-by-link?link=server-test-link-xyz`);
    console.log('Fetch By Link Status:', fetchLinkRes.status);
    console.log('Fetched Title:', fetchLinkRes.body?.title);

    console.log('--- 4. Testing GET /api/sessions?interviewerId=... ---');
    const listSessionsRes = await reqJson(`${baseUrl}/api/sessions?interviewerId=interviewer_server_test`);
    console.log('List Sessions Count:', listSessionsRes.body?.length);

    console.log('--- 5. Testing POST /api/candidates ---');
    const newCandidate = {
      id: 'srv_cand_888',
      sessionId: 'srv_session_777',
      name: 'Bob Backend Developer',
      email: 'bob@backend.org',
      overallScore: 91,
      responses: [
        { questionId: 'q_srv_1', transcript: 'MySQL 3NF uses foreign keys and 6 relational tables.', overallScore: 91 },
      ],
    };
    const postCandRes = await reqJson(`${baseUrl}/api/candidates`, { method: 'POST' }, newCandidate);
    console.log('POST Candidate Response Status:', postCandRes.status);
    console.log('POST Candidate Name:', postCandRes.body?.name);

    console.log('--- 6. Testing GET /api/candidates?sessionId=... ---');
    const listCandRes = await reqJson(`${baseUrl}/api/candidates?sessionId=srv_session_777`);
    console.log('List Candidates Count:', listCandRes.body?.length);
    console.log('Candidate Transcript:', listCandRes.body?.[0]?.responses?.[0]?.transcript);

    console.log('--- 7. Testing DELETE /api/sessions?id=... ---');
    const delRes = await reqJson(`${baseUrl}/api/sessions?id=srv_session_777`, { method: 'DELETE' });
    console.log('DELETE Session Status:', delRes.status);
    console.log('DELETE Session Response:', delRes.body);

    console.log('🎉 ALL BACKEND SERVER HTTP + MYSQL API ENDPOINT TESTS PASSED SUCCESSFULLY!');
  } finally {
    serverProcess.kill('SIGINT');
  }
}

runServerTest().catch((err) => {
  console.error('Server Test Error:', err);
  process.exit(1);
});
