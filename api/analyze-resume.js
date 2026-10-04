const { setCors, readBodyJson, sendJson } = require('./_utils.cjs');
const { callOpenAIJson } = require('./_openai.cjs');

const resumeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['skills', 'projects', 'questions', 'summary'],
  properties: {
    skills: {
      type: 'array',
      minItems: 3,
      maxItems: 16,
      items: { type: 'string' },
    },
    projects: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'technologies', 'impact'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          technologies: { type: 'array', maxItems: 8, items: { type: 'string' } },
          impact: { type: 'string' },
        },
      },
    },
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
          text: { type: 'string', minLength: 30 },
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
    summary: { type: 'string' },
  },
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
    const resumeText = `${body?.resumeText || ''}`.trim();
    const jobDescription = `${body?.jobDescription || ''}`.trim();
    const defaultTimeLimit = Number.parseInt(body?.defaultTimeLimit, 10) || 120;

    if (resumeText.length < 30) {
      sendJson(res, 400, { error: 'Please upload a text-readable resume with more detail.' });
      return;
    }

    const result = await callOpenAIJson({
      schemaName: 'resume_training_profile',
      schema: resumeSchema,
      maxOutputTokens: 2800,
      system: [
        'You are an interview training engine.',
        'Extract concrete skills and named projects from the resume.',
        'Generate personalized interview practice questions grounded in the candidate resume and the target role when provided.',
        'Every question must mention a resume-specific skill, project, achievement, tool, or responsibility.',
        'Avoid generic questions such as "tell me about yourself" or broad questions that could apply to anyone.',
      ].join(' '),
      user: JSON.stringify({
        task: 'Create a resume-based interview training profile.',
        defaultTimeLimit,
        jobDescription,
        resumeText,
      }),
    });

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.statusCode === 503 ? error.message : 'AI resume analysis failed.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
