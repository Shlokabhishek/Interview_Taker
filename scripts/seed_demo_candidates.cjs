const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const { putSession, putCandidate, listCandidates } = require('../api/_store.cjs');

const interviewerId = 'demo-interviewer';
const now = new Date();
const isoMinutesAgo = (minutes) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

const roleDefinitions = [
  {
    key: 'frontend',
    title: 'Frontend Developer',
    link: 'demo-frontend-developer',
    questions: [
      { id: 'demo-fe-q1', text: 'How do you design a reusable React component?', type: 'technical', expectedKeywords: ['React', 'props', 'state', 'testing'] },
      { id: 'demo-fe-q2', text: 'How do you improve frontend performance?', type: 'technical', expectedKeywords: ['profiling', 'memoization', 'bundle', 'lazy loading'] },
      { id: 'demo-fe-q3', text: 'Describe a frontend project where you solved a difficult user experience problem.', type: 'behavioral', expectedKeywords: ['users', 'tradeoff', 'iteration', 'impact'] },
    ],
  },
  {
    key: 'database',
    title: 'Database Manager',
    link: 'demo-database-manager',
    questions: [
      { id: 'demo-db-q1', text: 'How do you design a normalized relational database?', type: 'technical', expectedKeywords: ['normalization', 'foreign key', 'constraint', 'index'] },
      { id: 'demo-db-q2', text: 'How do you investigate and improve a slow SQL query?', type: 'technical', expectedKeywords: ['explain', 'index', 'execution plan', 'query'] },
      { id: 'demo-db-q3', text: 'How do you protect database reliability during a production migration?', type: 'situational', expectedKeywords: ['backup', 'rollback', 'transaction', 'monitoring'] },
    ],
  },
];

const candidateNames = [
  ['Aarav Sharma', 'Maya Patel', 'Lucas Martin', 'Sophia Chen', 'Noah Williams'],
  ['Olivia Brown', 'Ethan Wilson', 'Ananya Singh', 'Daniel Garcia', 'Emma Davis'],
];

const scoreSets = [
  [92, 86, 89, 81, 76],
  [94, 88, 84, 79, 72],
];

const buildAnalysis = (score, roleKey, index) => ({
  overallScore: score,
  averageRelevance: Math.max(0, score - 2),
  averageAccuracy: Math.max(0, score - 4),
  averageConfidence: Math.max(0, score - 1),
  topStrengths: roleKey === 'frontend'
    ? ['Strong component design', 'Clear performance tradeoffs', 'User-focused communication']
    : ['Strong schema design', 'Reliable migration planning', 'Practical query optimization'],
  topImprovements: index % 2 === 0
    ? ['Could provide more implementation detail']
    : ['Could explain monitoring metrics more deeply'],
  skillsSummary: roleKey === 'frontend'
    ? { communication: score - 3, problemSolving: score, technical: score - 1, adaptability: score - 5 }
    : { communication: score - 4, problemSolving: score - 1, technical: score, adaptability: score - 3 },
  totalQuestions: 3,
});

const buildResponses = (role, candidateIndex, score) => role.questions.map((question, questionIndex) => {
  const responseScore = Math.max(50, Math.min(100, score + (questionIndex - 1) * 2));
  const analysis = {
    overallScore: responseScore,
    relevance: Math.max(0, responseScore - 2),
    accuracy: Math.max(0, responseScore - 3),
    confidence: Math.max(0, responseScore - 1),
    keywordMatch: { matched: question.expectedKeywords.slice(0, 3), score: Math.max(0, responseScore - 4) },
    strengths: ['Uses concrete examples', 'Explains reasoning clearly'],
    improvements: ['Add more measurable impact'],
    wordCount: 54 + candidateIndex * 3,
    evidenceSummary: 'Seeded demonstration response for SQL-backed ranking and detail views.',
  };

  return {
    id: `demo-response-${role.key}-${candidateIndex + 1}-${questionIndex + 1}`,
    questionId: question.id,
    questionText: question.text,
    answer: `Candidate ${candidateIndex + 1} explains a practical ${role.title} approach with implementation details, tradeoffs, testing, monitoring, and measurable impact.`,
    analysis,
  };
});

async function seed() {
  const sessions = [];
  for (const role of roleDefinitions) {
    const session = {
      id: `demo-session-${role.key}`,
      interviewerId,
      interviewerName: 'Demo Interview Team',
      link: role.link,
      title: `${role.title} - Demo Hiring Round`,
      description: `Seeded SQL demo session for ranking ${role.title} candidates.`,
      questions: role.questions.map((question, index) => ({
        ...question,
        order: index + 1,
        weight: index === 0 ? 3 : 2,
        timeLimit: 120,
        evaluationCriteria: 'Evidence-based answer with clear ownership and practical reasoning.',
      })),
      timeLimit: 120,
      createdAt: isoMinutesAgo(180),
    };
    await putSession(session);
    sessions.push(session);
  }

  for (let roleIndex = 0; roleIndex < roleDefinitions.length; roleIndex += 1) {
    const role = roleDefinitions[roleIndex];
    const session = sessions[roleIndex];
    for (let candidateIndex = 0; candidateIndex < 5; candidateIndex += 1) {
      const score = scoreSets[roleIndex][candidateIndex];
      const createdAt = isoMinutesAgo(150 - candidateIndex * 12 - roleIndex * 4);
      const candidate = {
        id: `demo-candidate-${role.key}-${candidateIndex + 1}`,
        sessionId: session.id,
        name: candidateNames[roleIndex][candidateIndex],
        email: `${role.key}.candidate${candidateIndex + 1}@demo.interview.local`,
        status: 'completed',
        registeredAt: createdAt,
        completedAt: isoMinutesAgo(120 - candidateIndex * 10 - roleIndex * 3),
        createdAt,
        overallScore: score,
        rank: candidateIndex + 1,
        integrityConsent: true,
        resumeText: `${role.title} candidate with demonstrated ${role.key} engineering experience.`,
        resumeInsights: { role: role.title, source: 'seed-demo', skills: role.questions.flatMap((q) => q.expectedKeywords).slice(0, 8) },
        analysis: buildAnalysis(score, role.key, candidateIndex),
        responses: buildResponses(role, candidateIndex, score),
        integrityEvents: [
          {
            id: `demo-event-${role.key}-${candidateIndex + 1}`,
            eventType: 'review_sample',
            timestamp: Date.now() - candidateIndex * 1000,
            confidence: 0.05,
            penaltyWeight: 0.08,
            reverified: true,
          },
        ],
      };
      await putCandidate(candidate);
    }
  }

  const candidates = await listCandidates();
  const seeded = candidates
    .filter((candidate) => candidate.id.startsWith('demo-candidate-'))
    .sort((a, b) => b.overallScore - a.overallScore);

  console.table(seeded.map((candidate) => ({
    name: candidate.name,
    sessionId: candidate.sessionId,
    status: candidate.status,
    score: candidate.overallScore,
    responses: candidate.responses.length,
  })));
  console.log(`Seeded ${seeded.length} completed candidates across ${sessions.length} job roles.`);
}

seed().catch((error) => {
  console.error('Demo candidate seed failed:', error);
  process.exitCode = 1;
});
