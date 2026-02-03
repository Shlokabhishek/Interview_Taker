// AI Analysis utilities for candidate response evaluation

// Keywords for different skill categories
const SKILL_KEYWORDS = {
  communication: [
    'explain', 'communicate', 'present', 'articulate', 'express', 'convey',
    'discuss', 'clarify', 'elaborate', 'describe', 'demonstrate'
  ],
  problemSolving: [
    'analyze', 'solve', 'solution', 'approach', 'strategy', 'method',
    'resolve', 'address', 'tackle', 'overcome', 'debug', 'fix'
  ],
  teamwork: [
    'collaborate', 'team', 'together', 'coordinate', 'cooperate', 'support',
    'help', 'assist', 'contribute', 'share', 'partner'
  ],
  leadership: [
    'lead', 'manage', 'guide', 'direct', 'mentor', 'delegate',
    'motivate', 'inspire', 'organize', 'supervise', 'coordinate'
  ],
  technical: [
    'implement', 'develop', 'code', 'build', 'create', 'design',
    'architect', 'optimize', 'integrate', 'deploy', 'test'
  ],
  adaptability: [
    'adapt', 'flexible', 'change', 'adjust', 'learn', 'grow',
    'evolve', 'pivot', 'transition', 'embrace', 'new'
  ],
};

// Confidence indicators
const CONFIDENCE_POSITIVE = [
  'i am confident', 'i strongly believe', 'definitely', 'certainly',
  'absolutely', 'without doubt', 'i am sure', 'clearly'
];

const CONFIDENCE_NEGATIVE = [
  'i think maybe', 'not sure', 'possibly', 'might be', 'could be',
  'i guess', 'perhaps', 'uncertain', 'don\'t know'
];

// Analyze text for keyword matches
export const analyzeKeywordMatch = (text, expectedKeywords) => {
  if (!text || !expectedKeywords?.length) {
    return { matched: [], score: 0 };
  }

  const lowerText = text.toLowerCase();
  const matched = expectedKeywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );

  const score = expectedKeywords.length > 0 
    ? Math.round((matched.length / expectedKeywords.length) * 100)
    : 0;

  return { matched, score };
};

// Analyze skill presence in response
export const analyzeSkills = (text) => {
  if (!text) return {};

  const lowerText = text.toLowerCase();
  const skillScores = {};

  Object.entries(SKILL_KEYWORDS).forEach(([skill, keywords]) => {
    const matchCount = keywords.filter(kw => lowerText.includes(kw)).length;
    skillScores[skill] = Math.min(100, Math.round((matchCount / keywords.length) * 100 * 2));
  });

  return skillScores;
};

// Analyze confidence level
export const analyzeConfidence = (text) => {
  if (!text) return 50;

  const lowerText = text.toLowerCase();
  
  let positiveCount = CONFIDENCE_POSITIVE.filter(phrase => 
    lowerText.includes(phrase)
  ).length;

  let negativeCount = CONFIDENCE_NEGATIVE.filter(phrase => 
    lowerText.includes(phrase)
  ).length;

  // Base confidence
  let confidence = 50;
  
  // Adjust based on indicators
  confidence += positiveCount * 10;
  confidence -= negativeCount * 10;

  // Consider response length (longer responses generally show more engagement)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 100) confidence += 10;
  else if (wordCount > 50) confidence += 5;
  else if (wordCount < 20) confidence -= 10;

  return Math.min(100, Math.max(0, confidence));
};

// Calculate relevance score
export const calculateRelevance = (answer, question) => {
  if (!answer || !question) return 0;

  const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  if (questionWords.length === 0) return 50;

  const matchCount = questionWords.filter(word => answerWords.has(word)).length;
  
  // Also check for semantic relevance through answer length and structure
  const wordCount = answer.split(/\s+/).length;
  let lengthBonus = 0;
  
  if (wordCount >= 30 && wordCount <= 200) lengthBonus = 20;
  else if (wordCount >= 20) lengthBonus = 10;
  
  const baseScore = Math.round((matchCount / questionWords.length) * 80);
  
  return Math.min(100, baseScore + lengthBonus);
};

// Generate comprehensive analysis
export const analyzeResponse = (answer, question, expectedKeywords = [], weight = 1) => {
  const keywordAnalysis = analyzeKeywordMatch(answer, expectedKeywords);
  const skills = analyzeSkills(answer);
  const confidence = analyzeConfidence(answer);
  const relevance = calculateRelevance(answer, question);

  // Calculate accuracy based on keyword match and relevance
  const accuracy = Math.round((keywordAnalysis.score * 0.6 + relevance * 0.4));

  // Calculate overall score
  const overallScore = Math.round(
    (relevance * 0.25 + accuracy * 0.30 + confidence * 0.20 + keywordAnalysis.score * 0.25) * weight
  );

  // Identify strengths
  const strengths = [];
  if (confidence >= 70) strengths.push('Shows strong confidence');
  if (relevance >= 70) strengths.push('Addresses the question directly');
  if (keywordAnalysis.score >= 70) strengths.push('Uses relevant terminology');
  
  Object.entries(skills).forEach(([skill, score]) => {
    if (score >= 60) {
      strengths.push(`Demonstrates ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
  });

  // Identify areas for improvement
  const improvements = [];
  if (confidence < 50) improvements.push('Could show more confidence');
  if (relevance < 50) improvements.push('Could be more relevant to the question');
  if (keywordAnalysis.score < 50 && expectedKeywords.length > 0) {
    improvements.push('Could include more key concepts');
  }
  
  const wordCount = answer?.split(/\s+/).length || 0;
  if (wordCount < 30) improvements.push('Could provide more detailed response');
  if (wordCount > 300) improvements.push('Could be more concise');

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    relevance,
    accuracy,
    confidence,
    keywordMatch: keywordAnalysis,
    skills,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 3),
    wordCount,
  };
};

// Generate interview summary
export const generateInterviewSummary = (questionResults) => {
  if (!questionResults?.length) {
    return {
      overallScore: 0,
      averageRelevance: 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      topStrengths: [],
      topImprovements: [],
      skillsSummary: {},
    };
  }

  const totalQuestions = questionResults.length;
  
  // Calculate averages
  const sums = questionResults.reduce((acc, result) => ({
    score: acc.score + (result.overallScore || 0),
    relevance: acc.relevance + (result.relevance || 0),
    accuracy: acc.accuracy + (result.accuracy || 0),
    confidence: acc.confidence + (result.confidence || 0),
  }), { score: 0, relevance: 0, accuracy: 0, confidence: 0 });

  // Aggregate skills
  const skillsSummary = {};
  questionResults.forEach(result => {
    if (result.skills) {
      Object.entries(result.skills).forEach(([skill, score]) => {
        if (!skillsSummary[skill]) skillsSummary[skill] = [];
        skillsSummary[skill].push(score);
      });
    }
  });

  // Average skills
  Object.keys(skillsSummary).forEach(skill => {
    const scores = skillsSummary[skill];
    skillsSummary[skill] = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
  });

  // Collect all strengths and improvements
  const allStrengths = questionResults.flatMap(r => r.strengths || []);
  const allImprovements = questionResults.flatMap(r => r.improvements || []);

  // Count occurrences
  const strengthCounts = {};
  allStrengths.forEach(s => {
    strengthCounts[s] = (strengthCounts[s] || 0) + 1;
  });

  const improvementCounts = {};
  allImprovements.forEach(i => {
    improvementCounts[i] = (improvementCounts[i] || 0) + 1;
  });

  // Get top items
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strength]) => strength);

  const topImprovements = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([improvement]) => improvement);

  return {
    overallScore: Math.round(sums.score / totalQuestions),
    averageRelevance: Math.round(sums.relevance / totalQuestions),
    averageAccuracy: Math.round(sums.accuracy / totalQuestions),
    averageConfidence: Math.round(sums.confidence / totalQuestions),
    topStrengths,
    topImprovements,
    skillsSummary,
    totalQuestions,
  };
};

// Rank candidates based on scores
export const rankCandidates = (candidates) => {
  return [...candidates]
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
};
