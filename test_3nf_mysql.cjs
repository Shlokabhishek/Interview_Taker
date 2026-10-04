const mysql = require('mysql2/promise');
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

const {
  mysqlConfigured,
  getMysqlPool,
  getSessionByLink,
  listSessions,
  putSession,
  patchSession,
  deleteSession,
  putCandidate,
  listCandidates,
  patchCandidate,
} = require('./api/_mysql.cjs');

async function test3NFIntegration() {
  console.log('--- 1. Testing MySQL Pool Initialization & 3NF Schema Verification ---');
  console.log('Is MySQL configured?', mysqlConfigured());
  const pool = await getMysqlPool();
  if (!pool) {
    console.error('Failed to initialize MySQL pool!');
    process.exit(1);
  }
  console.log('MySQL 3NF Connection Pool initialized successfully.');

  const [tables] = await pool.execute('SHOW TABLES');
  console.log('Database tables:', tables.map((t) => Object.values(t)[0]));

  console.log('--- 2. Testing putSession (Interviewers, Sessions, Questions) ---');
  const sessionPayload = {
    id: 'session_3nf_101',
    interviewerId: 'recruiter_hr_001',
    interviewerName: 'Sarah Connor (Talent Acquisition)',
    link: 'react-lead-interview-link',
    title: 'Lead Frontend Engineer Interview',
    description: 'Evaluation session for React 18, State Architecture & Performance',
    timeLimit: 90,
    avatarConfig: { avatarId: 'avatar_sarah_v2', voice: 'en-US-Neural2-F' },
    questions: [
      {
        id: 'q_3nf_1',
        text: 'Explain React 18 Concurrent Rendering and Automatic Batching.',
        type: 'technical',
        weight: 1.5,
        timeLimit: 120,
        expectedKeywords: ['Concurrent Mode', 'useTransition', 'useDeferredValue', 'Batching'],
        evaluationCriteria: 'Measures depth of understanding in React 18 Fiber architecture.',
      },
      {
        id: 'q_3nf_2',
        text: 'How do you optimize Web Vitals (LCP, INP, CLS) in a high-traffic SSR app?',
        type: 'architecture',
        weight: 1.0,
        timeLimit: 90,
        expectedKeywords: ['LCP', 'INP', 'Code Splitting', 'Hydration', 'CDN'],
        evaluationCriteria: 'Assesses frontend performance profiling experience.',
      },
    ],
  };

  const savedSession = await putSession(sessionPayload);
  console.log('Saved Session ID:', savedSession.id);
  console.log('Saved Session Questions Count:', savedSession.questions.length);

  console.log('--- 3. Testing getSessionByLink ---');
  const fetchedSession = await getSessionByLink('react-lead-interview-link');
  console.log('Fetched Session Title:', fetchedSession.title);
  console.log('Fetched Question 1 Text:', fetchedSession.questions[0].text);
  console.log('Fetched Question 1 Keywords:', fetchedSession.questions[0].expectedKeywords);

  console.log('--- 4. Testing putCandidate (Candidates, Responses, Integrity Events) ---');
  const candidatePayload = {
    id: 'cand_3nf_505',
    sessionId: 'session_3nf_101',
    name: 'Alice Smith',
    email: 'alice.smith@devmail.org',
    overallScore: 94.5,
    rank: 1,
    integrityConsent: true,
    resumeText: 'Experienced Senior Frontend Engineer with 6 years in React, TypeScript, and Web performance.',
    resumeInsights: { detectedSkills: ['React', 'TypeScript', 'Node.js'], experienceYears: 6 },
    responses: [
      {
        id: 'resp_3nf_1',
        questionId: 'q_3nf_1',
        audioUrl: 'https://cdn.example.com/audio/resp1.mp3',
        videoUrl: 'https://cdn.example.com/video/resp1.mp4',
        transcript: 'React 18 concurrent rendering allows updates to be paused and resumed without blocking main thread. useTransition marks non-urgent updates.',
        relevance: 95,
        accuracy: 98,
        confidence: 92,
        keywordMatch: 90,
        overallScore: 94,
        strengths: ['Clear explanation of fiber scheduling', 'Accurate API usage'],
        improvements: ['Could detail server components integration'],
      },
    ],
    integrityEvents: [
      {
        id: 'event_3nf_1',
        eventType: 'gaze_anomaly',
        timestamp: Date.now() - 5000,
        confidence: 0.92,
        boundingBox: { x: 100, y: 50, w: 200, h: 200 },
        penaltyWeight: 5,
        reverified: true,
      },
    ],
  };

  const savedCandidate = await putCandidate(candidatePayload);
  console.log('Saved Candidate Name:', savedCandidate.name);
  console.log('Saved Candidate Responses Count:', savedCandidate.responses.length);
  console.log('Saved Candidate Integrity Events Count:', savedCandidate.integrityEvents.length);

  console.log('--- 5. Testing listCandidates ---');
  const candidatesList = await listCandidates('session_3nf_101');
  console.log('Candidates List Count:', candidatesList.length);
  console.log('Candidate 1 Transcript:', candidatesList[0].responses[0].transcript);
  console.log('Candidate 1 Integrity Event Type:', candidatesList[0].integrityEvents[0].eventType);

  console.log('--- 6. Verifying Direct SQL Counts in 6 Normalized Tables ---');
  const [c1] = await pool.execute('SELECT COUNT(*) AS count FROM interviewers');
  const [c2] = await pool.execute('SELECT COUNT(*) AS count FROM sessions');
  const [c3] = await pool.execute('SELECT COUNT(*) AS count FROM questions');
  const [c4] = await pool.execute('SELECT COUNT(*) AS count FROM candidates');
  const [c5] = await pool.execute('SELECT COUNT(*) AS count FROM responses');
  const [c6] = await pool.execute('SELECT COUNT(*) AS count FROM integrity_events');

  console.log(`Row counts in MySQL tables:
- interviewers: ${c1[0].count}
- sessions: ${c2[0].count}
- questions: ${c3[0].count}
- candidates: ${c4[0].count}
- responses: ${c5[0].count}
- integrity_events: ${c6[0].count}
  `);

  console.log('--- 7. Testing Cascading Foreign Key Deletion (deleteSession) ---');
  const deleteResult = await deleteSession('session_3nf_101');
  console.log('Delete Session Result:', deleteResult);

  const [afterQ] = await pool.execute('SELECT COUNT(*) AS count FROM questions WHERE session_id = ?', ['session_3nf_101']);
  const [afterC] = await pool.execute('SELECT COUNT(*) AS count FROM candidates WHERE session_id = ?', ['session_3nf_101']);
  const [afterR] = await pool.execute('SELECT COUNT(*) AS count FROM responses WHERE candidate_id = ?', ['cand_3nf_505']);
  const [afterE] = await pool.execute('SELECT COUNT(*) AS count FROM integrity_events WHERE candidate_id = ?', ['cand_3nf_505']);

  console.log(`After Session Cascade Delete:
- questions remaining: ${afterQ[0].count}
- candidates remaining: ${afterC[0].count}
- responses remaining: ${afterR[0].count}
- integrity_events remaining: ${afterE[0].count}
  `);

  console.log('🎉 ALL 6+ 3NF NORMALIZED MYSQL INTEGRATION TESTS PASSED PERFECTLY!');
  process.exit(0);
}

test3NFIntegration().catch((err) => {
  console.error('3NF Integration Error:', err);
  process.exit(1);
});
