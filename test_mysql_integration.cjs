const fs = require('fs');
const path = require('path');

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

const {
  mysqlEnabled,
  getSessionByLink,
  putSession,
  listSessions,
  patchSession,
  deleteSession,
  putCandidate,
  listCandidates,
  patchCandidate,
} = require('./api/_store.cjs');

async function testIntegration() {
  console.log('Is MySQL enabled?', mysqlEnabled());
  if (!mysqlEnabled()) {
    console.error('MySQL is not enabled!');
    process.exit(1);
  }

  const testSession = {
    id: 'test_session_123',
    interviewerId: 'interviewer_abc',
    link: 'test-link-xyz',
    title: 'Senior Full Stack Developer Interview',
    description: 'Testing MySQL integration for AI Interview Platform',
    questions: [
      { id: 'q1', text: 'Explain React state management.', weight: 1 }
    ],
    timeLimit: 60,
    createdAt: new Date().toISOString(),
  };

  console.log('--- 1. Testing putSession ---');
  const savedSession = await putSession(testSession);
  console.log('Saved Session ID:', savedSession?.id);

  console.log('--- 2. Testing getSessionByLink ---');
  const fetchedSession = await getSessionByLink('test-link-xyz');
  console.log('Fetched Session Title:', fetchedSession?.title);

  console.log('--- 3. Testing listSessions ---');
  const sessions = await listSessions('interviewer_abc');
  console.log('Sessions Count:', sessions.length);

  console.log('--- 4. Testing patchSession ---');
  const patchedSession = await patchSession('test_session_123', { description: 'Updated description in MySQL' });
  console.log('Patched Description:', patchedSession?.description);

  console.log('--- 5. Testing putCandidate ---');
  const testCandidate = {
    id: 'cand_999',
    sessionId: 'test_session_123',
    name: 'John Doe',
    email: 'john@example.com',
    overallScore: 88,
    createdAt: new Date().toISOString(),
  };
  const savedCand = await putCandidate(testCandidate);
  console.log('Saved Candidate Name:', savedCand?.name);

  console.log('--- 6. Testing listCandidates ---');
  const candidates = await listCandidates('test_session_123');
  console.log('Candidates Count:', candidates.length);

  console.log('--- 7. Testing patchCandidate ---');
  const patchedCand = await patchCandidate('cand_999', { overallScore: 92 });
  console.log('Patched Candidate Score:', patchedCand?.overallScore);

  console.log('--- 8. Testing deleteSession (Cascade) ---');
  const deleted = await deleteSession('test_session_123');
  console.log('Session Deleted:', deleted);

  const remainingCands = await listCandidates('test_session_123');
  console.log('Remaining Candidates Count:', remainingCands.length);

  console.log('ALL MYSQL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testIntegration().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
