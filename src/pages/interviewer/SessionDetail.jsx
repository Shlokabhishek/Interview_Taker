import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Users,
  FileText,
  Clock,
  Play,
  Pause,
  Settings,
  Plus,
  BarChart3,
  Download
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  Button, 
  Badge,
  Modal,
  ModalFooter,
  Alert,
  Progress
} from '../../components/shared';
import { formatDate, getScoreColor, QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS } from '../../utils/helpers';

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    sessions, 
    updateSession, 
    deleteSession, 
    publishSession, 
    closeSession,
    getCandidatesForSession 
  } = useInterview();

  const [session, setSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    const foundSession = sessions.find(s => s.id === id);
    if (foundSession) {
      setSession(foundSession);
      setCandidates(getCandidatesForSession(id));
    }
  }, [id, sessions, getCandidatesForSession]);

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Session not found</h2>
        <Link to="/interviewer/sessions">
          <Button variant="primary" className="mt-4">
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/interview/${session.link}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublish = () => {
    publishSession(session.id);
  };

  const handleClose = () => {
    closeSession(session.id);
  };

  const handleDelete = () => {
    deleteSession(session.id);
    navigate('/interviewer/sessions');
  };

  const completedCandidates = candidates.filter(c => c.status === 'completed');
  const averageScore = completedCandidates.length > 0
    ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.overallScore || 0), 0) / completedCandidates.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/interviewer/sessions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <Badge variant={session.status === 'active' ? 'success' : session.status === 'draft' ? 'warning' : 'default'}>
                {session.status}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{session.description || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.status === 'draft' && (
            <Button variant="primary" icon={Play} onClick={handlePublish}>
              Publish
            </Button>
          )}
          {session.status === 'active' && (
            <Button variant="secondary" icon={Pause} onClick={handleClose}>
              Close
            </Button>
          )}
          <Button
            variant="ghost"
            icon={Copy}
            onClick={handleCopyLink}
          >
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </Button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{session.questions?.length || 0}</p>
              <p className="text-sm text-gray-500">Questions</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              <p className="text-sm text-gray-500">Candidates</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCandidates.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              <p className="text-sm text-gray-500">Avg. Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Interview Link */}
      {session.status === 'active' && (
        <Alert
          type="success"
          title="Interview Link"
          message={`Share this link with candidates: ${window.location.origin}/interview/${session.link}`}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['questions', 'candidates', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions ({session.questions?.length || 0})</CardTitle>
              <Link to={`/interviewer/sessions/${session.id}/edit`}>
                <Button variant="secondary" size="sm" icon={Edit}>
                  Edit Questions
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {session.questions?.length > 0 ? (
              <div className="space-y-4">
                {session.questions.map((question, index) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-900">{question.text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={QUESTION_TYPE_COLORS[question.type]}>
                            {QUESTION_TYPE_LABELS[question.type]}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {question.timeLimit}s • Weight: {question.weight}
                          </span>
                          {question.expectedKeywords?.length > 0 && (
                            <span className="text-sm text-gray-500">
                              {question.expectedKeywords.length} keywords
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No questions added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Candidates Tab */}
      {activeTab === 'candidates' && (
        <Card>
          <CardHeader>
            <CardTitle>Candidates ({candidates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length > 0 ? (
              <div className="space-y-4">
                {candidates
                  .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
                  .map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                          <p className="text-sm text-gray-500">{candidate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={candidate.status === 'completed' ? 'success' : 'warning'}>
                          {candidate.status}
                        </Badge>
                        {candidate.overallScore !== null && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidate.overallScore)}`}>
                            {candidate.overallScore}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No candidates have joined yet</p>
                {session.status === 'active' && (
                  <p className="text-sm text-gray-400 mt-2">
                    Share the interview link to start receiving candidates
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Session Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="font-medium text-gray-900">{session.settings?.totalDuration || 30} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Default Time Per Question</p>
                <p className="font-medium text-gray-900">{session.settings?.defaultTimePerQuestion || 120} seconds</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Video Recording</p>
                <p className="font-medium text-gray-900">{session.settings?.recordVideo ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Audio Recording</p>
                <p className="font-medium text-gray-900">{session.settings?.recordAudio ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Show Timer</p>
                <p className="font-medium text-gray-900">{session.settings?.showTimer ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Allow Late Entry</p>
                <p className="font-medium text-gray-900">{session.settings?.allowLateEntry ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Session"
        description="This action cannot be undone."
      >
        <Alert
          type="warning"
          message={`You are about to delete "${session.title}". All questions, candidates, and data will be permanently removed.`}
        />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Session
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SessionDetail;
