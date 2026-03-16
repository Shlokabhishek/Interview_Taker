import { generateId, QUESTION_TYPES } from './helpers';

const TECHNOLOGY_PATTERNS = [
  ['React', /\breact(?:\.js)?\b/i],
  ['TypeScript', /\btypescript\b|\bts\b/i],
  ['JavaScript', /\bjavascript\b|\bes6\b|\bnode\.js\b/i],
  ['Node.js', /\bnode(?:\.js)?\b/i],
  ['Python', /\bpython\b/i],
  ['Java', /\bjava\b/i],
  ['SQL', /\bsql\b|\bpostgres(?:ql)?\b|\bmysql\b/i],
  ['AWS', /\baws\b|\bamazon web services\b/i],
  ['Docker', /\bdocker\b/i],
  ['Kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['REST APIs', /\brest\b|\bapi\b/i],
  ['GraphQL', /\bgraphql\b/i],
  ['Testing', /\bjest\b|\btesting\b|\bunit tests?\b|\bautomation\b/i],
  ['CI/CD', /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous delivery\b/i],
  ['System Design', /\bsystem design\b|\bscalab(?:le|ility)\b|\barchitecture\b/i],
  ['Machine Learning', /\bmachine learning\b|\bml\b/i],
  ['LLMs', /\bllm\b|\bgenerative ai\b|\bprompt\b|\bopenai\b/i],
  ['Data Analysis', /\bdata analysis\b|\bdata analytics\b|\bpower bi\b|\btableau\b/i],
  ['Security', /\bsecurity\b|\bsecure coding\b|\bthreat\b/i],
  ['Agile Delivery', /\bagile\b|\bscrum\b|\bkanban\b/i],
];

const RESPONSIBILITY_HINTS = [
  'build', 'design', 'develop', 'lead', 'own', 'manage', 'optimize', 'deliver',
  'collaborate', 'mentor', 'analyze', 'support', 'deploy', 'maintain', 'improve',
];

const normalizeText = (value) => (value || '').replace(/\r/g, '').trim();

export const parseKeywordString = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item || ''}`.trim()).filter(Boolean);
  }

  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const normalizeQuestion = (question, options = {}) => {
  const {
    order = 1,
    defaultTimeLimit = 120,
    source = 'manual',
  } = options;

  return {
    id: question?.id || generateId(),
    text: normalizeText(question?.text),
    type: question?.type || QUESTION_TYPES.TECHNICAL,
    timeLimit: clampNumber(question?.timeLimit, 30, 600, defaultTimeLimit),
    weight: clampNumber(question?.weight, 1, 5, 1),
    isImportant: Boolean(question?.isImportant),
    expectedKeywords: parseKeywordString(question?.expectedKeywords),
    evaluationCriteria: normalizeText(question?.evaluationCriteria),
    order,
    source: question?.source || source,
    category: question?.category || null,
  };
};

const getRoleTitle = (jobDescription) => {
  const lines = normalizeText(jobDescription)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLongLine = lines.find((line) => line.length > 4 && line.length < 90);
  return firstLongLine || 'this role';
};

const extractBulletPoints = (jobDescription) => {
  const lines = normalizeText(jobDescription)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .filter((line) => /^[-*•]/.test(line) || RESPONSIBILITY_HINTS.some((hint) => line.toLowerCase().includes(hint)))
    .map((line) => line.replace(/^[-*•]\s*/, ''))
    .slice(0, 12);
};

const extractSkills = (jobDescription) => {
  const detected = TECHNOLOGY_PATTERNS
    .filter(([, pattern]) => pattern.test(jobDescription))
    .map(([label]) => label);

  const explicitPhrases = normalizeText(jobDescription)
    .match(/(?:experience with|proficient in|strong knowledge of|hands-on with|expertise in)\s+([^.;\n]+)/gi) || [];

  explicitPhrases.forEach((phrase) => {
    phrase
      .replace(/^(?:experience with|proficient in|strong knowledge of|hands-on with|expertise in)\s+/i, '')
      .split(/,|\/| and /i)
      .map((item) => item.trim())
      .filter((item) => item.length > 2 && item.length < 40)
      .forEach((item) => {
        if (!detected.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
          detected.push(item);
        }
      });
  });

  return detected.slice(0, 8);
};

const uniqueByText = (questions) => {
  const seen = new Set();
  return questions.filter((question) => {
    const key = question.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const generateQuestionsFromJobDescription = ({
  jobDescription,
  defaultTimeLimit = 120,
}) => {
  const sourceText = normalizeText(jobDescription);
  if (!sourceText) {
    return [];
  }

  const roleTitle = getRoleTitle(sourceText);
  const skills = extractSkills(sourceText);
  const responsibilities = extractBulletPoints(sourceText);
  const primarySkill = skills[0] || 'the core skills listed in the job description';
  const secondarySkill = skills[1] || skills[0] || 'the required tools and workflows';
  const topResponsibility = responsibilities[0] || 'the most important responsibilities in this role';
  const collaborationResponsibility =
    responsibilities.find((item) => /team|stakeholder|cross-functional|partner|collabor/i.test(item)) ||
    'working with cross-functional stakeholders';

  const draftQuestions = [
    {
      text: `Walk me through how you would approach ${topResponsibility.toLowerCase()} in ${roleTitle}.`,
      type: QUESTION_TYPES.TECHNICAL,
      category: 'technical',
      weight: 3,
      isImportant: true,
      expectedKeywords: [primarySkill, secondarySkill],
      evaluationCriteria: 'Looks for a structured technical approach, sound tradeoffs, and practical delivery steps.',
    },
    {
      text: `What technical decisions would you make to deliver strong results with ${primarySkill}?`,
      type: QUESTION_TYPES.TECHNICAL,
      category: 'technical',
      weight: 3,
      expectedKeywords: [primarySkill, 'tradeoffs', 'performance'],
      evaluationCriteria: 'Assess depth in architecture, implementation choices, and awareness of tradeoffs.',
    },
    {
      text: `Describe a project where you used ${primarySkill} to solve a meaningful business problem. What was your contribution?`,
      type: QUESTION_TYPES.SKILL_SPECIFIC,
      category: 'skill-specific',
      weight: 2,
      isImportant: true,
      expectedKeywords: [primarySkill, 'impact', 'ownership'],
      evaluationCriteria: 'Strong answers include direct ownership, measurable outcomes, and specific execution details.',
    },
    {
      text: `How have you kept your skills current in ${secondarySkill}, and how would that help you succeed in this role?`,
      type: QUESTION_TYPES.SKILL_SPECIFIC,
      category: 'skill-specific',
      weight: 2,
      expectedKeywords: [secondarySkill, 'learning', 'best practices'],
      evaluationCriteria: 'Looks for continuous learning, real application, and role alignment.',
    },
    {
      text: `Tell me about a time you had to balance speed, quality, and stakeholder expectations while ${collaborationResponsibility.toLowerCase()}.`,
      type: QUESTION_TYPES.BEHAVIORAL,
      category: 'behavioral',
      weight: 2,
      expectedKeywords: ['stakeholders', 'communication', 'prioritization'],
      evaluationCriteria: 'Strong answers use a clear situation, actions, results, and communication strategy.',
    },
    {
      text: `Describe a time you received tough feedback on your work. How did you respond, and what changed afterward?`,
      type: QUESTION_TYPES.BEHAVIORAL,
      category: 'behavioral',
      weight: 2,
      expectedKeywords: ['feedback', 'growth', 'improvement'],
      evaluationCriteria: 'Looks for coachability, ownership, and evidence of improvement.',
    },
    {
      text: `Imagine you join as a ${roleTitle} and discover that a key deliverable is slipping because requirements keep changing. What would you do first?`,
      type: QUESTION_TYPES.SITUATIONAL,
      category: 'scenario-based',
      weight: 2,
      expectedKeywords: ['prioritize', 'clarify', 'communicate'],
      evaluationCriteria: 'Strong answers show structured triage, stakeholder alignment, and risk management.',
    },
    {
      text: `If you were responsible for ${topResponsibility.toLowerCase()} but had limited time and incomplete information, how would you decide what to tackle first?`,
      type: QUESTION_TYPES.SITUATIONAL,
      category: 'scenario-based',
      weight: 2,
      expectedKeywords: ['prioritization', 'risk', 'decision making'],
      evaluationCriteria: 'Looks for judgment, prioritization framework, and sensible escalation points.',
    },
  ];

  return uniqueByText(draftQuestions).map((question, index) =>
    normalizeQuestion(question, {
      order: index + 1,
      defaultTimeLimit,
      source: 'generated',
    })
  );
};
