const { setCors, readBodyJson, sendJson } = require('./_utils.cjs');
const { callOpenAIJson } = require('./_openai.cjs');

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'overallScore',
    'relevance',
    'accuracy',
    'confidence',
    'keywordMatch',
    'skills',
    'strengths',
    'improvements',
    'wordCount',
    'evidenceSummary',
  ],
  properties: {
    overallScore: { type: 'integer', minimum: 0, maximum: 100 },
    relevance: { type: 'integer', minimum: 0, maximum: 100 },
    accuracy: { type: 'integer', minimum: 0, maximum: 100 },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
    keywordMatch: {
      type: 'object',
      additionalProperties: false,
      required: ['matched', 'score'],
      properties: {
        matched: { type: 'array', items: { type: 'string' } },
        score: { type: 'integer', minimum: 0, maximum: 100 },
      },
    },
    skills: {
      type: 'object',
      additionalProperties: false,
      required: ['communication', 'problemSolving', 'teamwork', 'leadership', 'technical', 'adaptability'],
      properties: {
        communication: { type: 'integer', minimum: 0, maximum: 100 },
        problemSolving: { type: 'integer', minimum: 0, maximum: 100 },
        teamwork: { type: 'integer', minimum: 0, maximum: 100 },
        leadership: { type: 'integer', minimum: 0, maximum: 100 },
        technical: { type: 'integer', minimum: 0, maximum: 100 },
        adaptability: { type: 'integer', minimum: 0, maximum: 100 },
      },
    },
    strengths: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
    },
    improvements: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
    },
    wordCount: { type: 'integer', minimum: 0 },
    evidenceSummary: { type: 'string' },
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
    const answer = `${body?.answer || ''}`.trim();
    const question = `${body?.question || ''}`.trim();

    if (!question) {
      sendJson(res, 400, { error: 'Missing question.' });
      return;
    }

    const result = await callOpenAIJson({
      schemaName: 'interview_response_analysis',
      schema: analysisSchema,
      maxOutputTokens: 1400,
      system: [
        'You are an interview evaluation engine.',
        'Score only the candidate answer against the given question and rubric.',
        'Be fair and evidence-based. Do not reward empty, vague, or unrelated answers.',
        'Use 0 for missing answers. Keep scores calibrated: 50 is weak/incomplete, 70 is solid, 85 is strong, 95 is exceptional.',
      ].join(' '),
      user: JSON.stringify({
        question,
        answer,
        expectedKeywords: Array.isArray(body?.expectedKeywords) ? body.expectedKeywords : [],
        evaluationCriteria: body?.evaluationCriteria || '',
        questionType: body?.questionType || '',
        weight: Number(body?.weight) || 1,
        rubric: {
          relevance: 'Does the answer directly address the question?',
          accuracy: 'Is the answer technically and practically correct for the role?',
          confidence: 'Does the answer show clarity, specificity, and credible ownership?',
          keywordMatch: 'Which expected concepts appear naturally in the answer?',
          overallScore: 'Weighted holistic score, still capped at 100.',
        },
      }),
    });

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.statusCode === 503 ? error.message : 'AI response analysis failed.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
