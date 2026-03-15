import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter,
  Download,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Input,
  Select,
  Progress,
  Modal,
  ModalFooter
} from '../../components/shared';
import { getScoreColor, getScoreGrade, formatDate } from '../../utils/helpers';
import { generateInterviewSummary, rankCandidates } from '../../utils/aiAnalysis';

const Candidates = () => {
  const { candidates, sessions } = useInterview();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const selectedCandidateComputed = useMemo(() => {
    if (!selectedCandidate) return null;

    const hasStoredSummary = Boolean(selectedCandidate.analysis) && Number.isFinite(selectedCandidate.overallScore);
    if (hasStoredSummary) return selectedCandidate;

    const analysisResults = (selectedCandidate.responses || [])
      .map(r => r?.analysis)
      .filter(Boolean);

    if (analysisResults.length === 0) return selectedCandidate;

    const summary = generateInterviewSummary(analysisResults);
    const overallScore = Math.round(
      analysisResults.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analysisResults.length
    );

    return { ...selectedCandidate, analysis: summary, overallScore };
  }, [selectedCandidate]);

  const formatSkillName = (skill) => {
    return String(skill)
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  };

  // Get completed candidates
  const completedCandidates = useMemo(() => {
    return candidates.filter(c => c.status === 'completed');
  }, [candidates]);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = completedCandidates.filter(candidate => {
      const matchesSearch = 
        candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSession = sessionFilter === 'all' || candidate.sessionId === sessionFilter;
      return matchesSearch && matchesSession;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'score':
          comparison = (a.overallScore || 0) - (b.overallScore || 0);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'date':
          comparison = new Date(a.completedAt || 0) - new Date(b.completedAt || 0);
          break;
        default:
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return rankCandidates(result);
  }, [completedCandidates, searchQuery, sessionFilter, sortBy, sortOrder]);

  // Session options for filter
  const sessionOptions = [
    { value: 'all', label: 'All Sessions' },
    ...sessions.map(s => ({ value: s.id, label: s.title })),
  ];

  // Calculate stats
  const stats = useMemo(() => {
    if (completedCandidates.length === 0) {
      return { average: 0, highest: 0, lowest: 0, topPerformers: 0 };
    }

    const scores = completedCandidates.map(c => c.overallScore || 0);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      topPerformers: scores.filter(s => s >= 80).length,
    };
  }, [completedCandidates]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const viewCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Badge variant="warning" className="bg-yellow-400 text-yellow-900">🥇 1st</Badge>;
    if (rank === 2) return <Badge variant="default" className="bg-gray-300 text-gray-700">🥈 2nd</Badge>;
    if (rank === 3) return <Badge variant="default" className="bg-orange-300 text-orange-800">🥉 3rd</Badge>;
    return <Badge variant="default">#{rank}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">Review and compare candidate performance.</p>
        </div>
        <Button variant="secondary" icon={Download}>
          Export Results
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCandidates.length}</p>
              <p className="text-sm text-gray-500">Total Completed</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.highest}%</p>
              <p className="text-sm text-gray-500">Highest Score</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.topPerformers}</p>
              <p className="text-sm text-gray-500">Top Performers (80%+)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            options={sessionOptions}
            className="w-48"
          />
        </div>
      </Card>

      {/* Candidates Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Candidate
                    {sortBy === 'name' && (sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
                  </span>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Session</th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('score')}
                >
                  <span className="flex items-center gap-1">
                    Score
                    {sortBy === 'score' && (sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
                  </span>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Grade</th>
                <th 
                  className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('date')}
                >
                  <span className="flex items-center gap-1">
                    Date
                    {sortBy === 'date' && (sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
                  </span>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => {
                  const session = sessions.find(s => s.id === candidate.sessionId);
                  return (
                    <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        {getRankBadge(candidate.rank)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {candidate.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{candidate.name}</p>
                            <p className="text-sm text-gray-500">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">{session?.title || 'Unknown'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Progress value={candidate.overallScore || 0} size="sm" className="w-20" />
                          <span className={`font-medium ${getScoreColor(candidate.overallScore || 0).split(' ')[0]}`}>
                            {candidate.overallScore || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getScoreColor(candidate.overallScore || 0)}`}>
                          {getScoreGrade(candidate.overallScore || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-500">
                          {candidate.completedAt ? formatDate(candidate.completedAt) : '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => viewCandidateDetails(candidate)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No candidates found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Candidate Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Candidate Details"
        size="lg"
      >
        {selectedCandidateComputed && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold text-2xl">
                  {selectedCandidateComputed.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedCandidateComputed.name}</h3>
                <p className="text-gray-500">{selectedCandidateComputed.email}</p>
              </div>
              <div className="ml-auto">
                {getRankBadge(selectedCandidateComputed.rank)}
              </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{selectedCandidateComputed.overallScore || 0}%</p>
                <p className="text-sm text-gray-500">Overall Score</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{selectedCandidateComputed.analysis?.averageRelevance || 0}%</p>
                <p className="text-sm text-gray-500">Relevance</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{selectedCandidateComputed.analysis?.averageAccuracy || 0}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{selectedCandidateComputed.analysis?.averageConfidence || 0}%</p>
                <p className="text-sm text-gray-500">Confidence</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {(selectedCandidateComputed.analysis?.topStrengths || ['Good communication', 'Clear responses']).map((strength, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {(selectedCandidateComputed.analysis?.topImprovements || ['Could provide more details']).map((improvement, i) => (
                    <li key={i} className="text-sm text-orange-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Skills Summary */}
            {selectedCandidateComputed.analysis?.skillsSummary && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Skills Summary</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(selectedCandidateComputed.analysis.skillsSummary).map(([skill, score]) => (
                    <div key={skill} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">{formatSkillName(skill)}</p>
                        <p className="text-sm text-gray-600">{score}%</p>
                      </div>
                      <Progress value={score} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question-by-question breakdown */}
            {Array.isArray(selectedCandidateComputed.responses) && selectedCandidateComputed.responses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Question-wise Evaluation</h4>
                <div className="space-y-2">
                  {selectedCandidateComputed.responses.map((r, idx) => {
                    const a = r?.analysis || {};
                    const score = a.overallScore ?? 0;
                    return (
                      <details key={r?.questionId || idx} className="group rounded-lg border border-gray-200 bg-white">
                        <summary className="cursor-pointer list-none p-4 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Q{idx + 1}: {r?.questionText || 'Question'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Relevance {a.relevance ?? 0}% · Accuracy {a.accuracy ?? 0}% · Confidence {a.confidence ?? 0}%
                            </p>
                          </div>
                          <div className={`shrink-0 ml-4 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
                            {score}%
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Answer (transcribed)</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {r?.answer || '-'}
                            </p>
                          </div>
                          {Array.isArray(a.keywordMatch?.matched) && a.keywordMatch.matched.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Matched Keywords</p>
                              <div className="flex flex-wrap gap-2">
                                {a.keywordMatch.matched.slice(0, 12).map((kw) => (
                                  <Badge key={kw} variant="default" className="bg-gray-100 text-gray-700">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {(Array.isArray(a.improvements) && a.improvements.length > 0) && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Improvement Hints</p>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {a.improvements.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="mt-2 w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Candidates;
