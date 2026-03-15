import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Home,
  Mail,
  BarChart3
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { CandidateLayout } from '../../components/layouts';
import { Card, CardContent, Button, Badge, Progress } from '../../components/shared';
import { getScoreColor, getScoreGrade } from '../../utils/helpers';

const InterviewComplete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { link } = useParams();
  const { candidates, getSessionByLink } = useInterview();
  
  const candidateId = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    const fromQuery = params.get('candidate');
    const fromState = location.state?.candidateId;
    if (fromQuery) return fromQuery;
    if (fromState) return fromState;
    try {
      return localStorage.getItem(`lastCandidateId_${link}`);
    } catch (e) {
      return null;
    }
  }, [link, location.search, location.state]);

  const candidate = useMemo(() => {
    if (!candidateId) return null;
    const inMemory = candidates.find(c => c.id === candidateId) || null;
    if (inMemory) return inMemory;

    try {
      const stored = JSON.parse(localStorage.getItem('allCandidates') || '[]');
      return stored.find(c => c.id === candidateId) || null;
    } catch (e) {
      return null;
    }
  }, [candidateId, candidates]);

  const session = useMemo(() => {
    return getSessionByLink(link);
  }, [getSessionByLink, link]);

  const overallScore = candidate?.overallScore ?? null;
  const scoreColor = getScoreColor(overallScore || 0);
  const grade = getScoreGrade(overallScore || 0);

  return (
    <CandidateLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <Card className="shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Interview Complete!
              </h1>
              <p className="text-green-100">
                Thank you for your time, {candidate?.name || 'Candidate'}
              </p>
            </div>

            <CardContent className="p-8">
              {/* Summary */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Session</p>
                    <p className="font-medium text-gray-900">
                      {session?.title || 'Interview Session'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Questions Answered</p>
                    <p className="font-medium text-gray-900">
                      {candidate?.responses?.length || 0} questions completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-gray-900">
                      {candidate?.status === 'completed' ? 'Evaluated' : 'Submitted for Review'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results */}
              {candidate?.status === 'completed' && (
                <div className="p-5 bg-white border border-gray-200 rounded-lg mb-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-600" />
                        Your Evaluation
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        This score is generated automatically from your interview responses.
                      </p>
                    </div>
                    <Badge className={`${scoreColor} font-semibold`}>
                      Grade {grade}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-1 text-center">
                      <p className="text-3xl font-bold text-gray-900">{overallScore || 0}%</p>
                      <p className="text-xs text-gray-500">Overall Score</p>
                    </div>
                    <div className="col-span-2">
                      <Progress value={overallScore || 0} size="md" />
                      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-lg font-semibold text-gray-900">{candidate.analysis?.averageRelevance || 0}%</p>
                          <p className="text-xs text-gray-500">Relevance</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-lg font-semibold text-gray-900">{candidate.analysis?.averageAccuracy || 0}%</p>
                          <p className="text-xs text-gray-500">Accuracy</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-lg font-semibold text-gray-900">{candidate.analysis?.averageConfidence || 0}%</p>
                          <p className="text-xs text-gray-500">Confidence</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {(candidate.analysis?.topStrengths || []).slice(0, 5).map((strength, i) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="mt-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>{strength}</span>
                          </li>
                        ))}
                        {(candidate.analysis?.topStrengths || []).length === 0 && (
                          <li className="text-sm text-green-700">No strengths detected yet.</li>
                        )}
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Areas to Improve</h4>
                      <ul className="space-y-1">
                        {(candidate.analysis?.topImprovements || []).slice(0, 5).map((improvement, i) => (
                          <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                            <span className="mt-2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                        {(candidate.analysis?.topImprovements || []).length === 0 && (
                          <li className="text-sm text-orange-700">No improvements detected yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!candidate && (
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-8">
                  <p className="text-sm text-yellow-900 font-medium">Results not found in this browser.</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    This demo stores data locally. If you opened the interview in a different browser/incognito window, the interviewer page will not see it.
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-8">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      The hiring team will review your responses and may contact you 
                      via email for next steps.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Response time typically takes 3-5 business days.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action */}
              <Button 
                variant="primary" 
                className="w-full"
                icon={Home}
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Need help? Contact the hiring team directly for any questions 
            about your application.
          </p>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default InterviewComplete;
