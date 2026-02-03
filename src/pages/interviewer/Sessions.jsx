import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  FileText,
  Users,
  Clock,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { 
  Card, 
  CardContent, 
  Button, 
  Badge, 
  Input, 
  Modal,
  ModalFooter,
  Alert 
} from '../../components/shared';
import { formatDate } from '../../utils/helpers';

const Sessions = () => {
  const navigate = useNavigate();
  const { sessions, deleteSession, getCandidatesForSession } = useInterview();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).reverse();

  const handleCopyLink = (session) => {
    const link = `${window.location.origin}/interview/${session.link}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(session.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDelete = () => {
    if (selectedSession) {
      deleteSession(selectedSession.id);
      setDeleteModalOpen(false);
      setSelectedSession(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'warning',
      active: 'success',
      closed: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Sessions</h1>
          <p className="text-gray-600 mt-1">Manage your interview sessions and questions.</p>
        </div>
        <Link to="/interviewer/sessions/new">
          <Button variant="primary" icon={Plus}>
            New Session
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'active', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="grid gap-4">
          {filteredSessions.map((session) => {
            const candidateCount = getCandidatesForSession(session.id).length;
            const completedCount = getCandidatesForSession(session.id).filter(c => c.status === 'completed').length;

            return (
              <Card key={session.id} padding="none" className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-gray-500 mt-1">{session.description || 'No description'}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {session.questions?.length || 0} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {completedCount}/{candidateCount} candidates
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.settings?.totalDuration || 30} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Copy}
                        onClick={() => handleCopyLink(session)}
                      >
                        {copiedLink === session.id ? 'Copied!' : 'Copy Link'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => navigate(`/interviewer/sessions/${session.id}`)}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {session.status === 'active' && (
                  <div className="px-6 py-3 bg-green-50 border-t border-green-100 flex items-center justify-between">
                    <span className="text-sm text-green-700">
                      Interview link: {window.location.origin}/interview/{session.link}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ExternalLink}
                      onClick={() => window.open(`/interview/${session.link}`, '_blank')}
                    >
                      Open
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first interview session to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link to="/interviewer/sessions/new">
              <Button variant="primary" icon={Plus}>
                Create Session
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
      >
        <Alert
          type="warning"
          message={`You are about to delete "${selectedSession?.title}". All questions and candidate data will be permanently removed.`}
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

export default Sessions;
