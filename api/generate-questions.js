const { setCors, readBodyJson, sendJson } = require('./_utils.cjs');
const { callOpenAIJson } = require('./_openai.cjs');

const questionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      minItems: 6,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'text',
          'type',
          'timeLimit',
          'weight',
          'isImportant',
          'expectedKeywords',
          'evaluationCriteria',
          'category',
        ],
        properties: {
          text: { type: 'string', minLength: 20 },
          type: {
            type: 'string',
            enum: ['technical', 'skill_specific', 'behavioral', 'situational', 'hr'],
          },
          timeLimit: { type: 'integer', minimum: 30, maximum: 600 },
          weight: { type: 'integer', minimum: 1, maximum: 5 },
          isImportant: { type: 'boolean' },
          expectedKeywords: {
            type: 'array',
            minItems: 2,
            maxItems: 8,
            items: { type: 'string' },
          },
          evaluationCriteria: { type: 'string', minLength: 20 },
          category: { type: 'string' },
        },
      },
    },
  },
};

const sanitizeJobDescription = (jd) => {
  let trimmed = `${jd || ''}`.trim();
  if (!trimmed) return '';

  // If JD is extremely long (e.g. > 12000 chars), truncate safely while preserving key details
  if (trimmed.length > 12000) {
    const start = trimmed.slice(0, 10000);
    const end = trimmed.slice(-2000);
    trimmed = `${start}\n\n[... middle content truncated for processing ...]\n\n${end}`;
  }

  return trimmed;
};

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readBodyJson(req);
    const rawJd = `${body?.jobDescription || ''}`.trim();
    const jobDescription = sanitizeJobDescription(rawJd);
    const resumeText = `${body?.resumeText || ''}`.trim();
    const resumeProfile = body?.resumeProfile && typeof body.resumeProfile === 'object' ? body.resumeProfile : null;
    const defaultTimeLimit = Number.parseInt(body?.defaultTimeLimit, 10) || 120;

    if (!jobDescription && !resumeText && !resumeProfile) {
      sendJson(res, 400, {
        error: 'Please provide a job title, job description, or candidate resume.',
      });
      return;
    }

    const isShortJd = jobDescription.length > 0 && jobDescription.length < 150;

    const result = await callOpenAIJson({
      schemaName: 'interview_questions',
      schema: questionSchema,
      maxOutputTokens: 3000,
      system: [
        'You create relevant, high-quality interview questions from job descriptions and role titles.',
        'Make questions specific to the role, seniority, responsibilities, and required skills.',
        'When resume details are provided, anchor questions in the candidate skills, projects, and accomplishments.',
        isShortJd
          ? 'The provided job description is concise. Infer the standard responsibilities, key technical tools, core challenges, and interview topics for this role (e.g. performance, state management, testing, architecture, collaboration) and generate 6-10 comprehensive, role-specific interview questions.'
          : 'If the input is extensive, filter out generic boilerplate (e.g., benefits, company blurb) and focus strictly on the key technical requirements, primary responsibilities, and candidate skills.',
        'Balance technical depth, role scenarios, behavioral evidence, and practical skill validation.',
        'Do not ask generic questions. Prefer concrete questions that reference a tool, project, domain, responsibility, or achievement.',
      ].join(' '),
      user: JSON.stringify({
        task: resumeText || resumeProfile
          ? 'Generate personalized interview questions for this role and resume.'
          : 'Generate interview questions for this role.',
        defaultTimeLimit,
        desiredQuestionCount: 8,
        jobDescription,
        resumeText,
        resumeProfile,
      }),
    });

    sendJson(res, 200, result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const exposeMessage =
      statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      statusCode === 404 ||
      statusCode === 429 ||
      statusCode === 503;

    sendJson(res, statusCode, {
      error: exposeMessage ? error.message : 'AI question generation failed.',
      detail: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};
