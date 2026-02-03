import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  BarChart3,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useInterview } from '../../contexts/InterviewContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from '../../components/shared';
import { formatDate, getScoreColor } from '../../utils/helpers';

const Dashboard = () => {
  const { sessions, candidates } = useInterview();
  const { user } = useAuth();

  // Calculate statistics
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalCandidates = candidates.length;
  const completedInterviews = candidates.filter(c => c.status === 'completed').length;
  const averageScore = completedInterviews > 0
    ? Math.round(candidates.reduce((sum, c) => sum + (c.overallScore || 0), 0) / completedInterviews)
    : 0;

  const recentSessions = sessions.slice(-5).reverse();
  const recentCandidates = candidates
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    .slice(0, 5);

  const stats = [
    { label: 'Active Sessions', value: activeSessions, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Candidates', value: totalCandidates, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Completed', value: completedInterviews, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg. Score', value: `${averageScore}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your interviews.</p>
        </div>
        <Link to="/interviewer/sessions/new">
          <Button variant="primary" icon={Plus}>
            New Session
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" className="card-hover">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sessions</CardTitle>
              <Link to="/interviewer/sessions" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    to={`/interviewer/sessions/${session.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-500">{session.questions?.length || 0} questions</p>
                      </div>
                    </div>
                    <Badge variant={session.status === 'active' ? 'success' : session.status === 'draft' ? 'warning' : 'default'}>
                      {session.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sessions yet</p>
                <Link to="/interviewer/sessions/new">
                  <Button variant="primary" size="sm" className="mt-4" icon={Plus}>
                    Create Session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Candidates</CardTitle>
              <Link to="/interviewer/candidates" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCandidates.length > 0 ? (
              <div className="space-y-4">
                {recentCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {candidate.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidate.overallScore || 0)}`}>
                      {candidate.overallScore || 0}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No completed interviews yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/interviewer/sessions/new"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="p-2 bg-primary-100 rounded-lg">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">New Session</h4>
                <p className="text-sm text-gray-500">Create interview session</p>
              </div>
            </Link>

            <Link
              to="/interviewer/avatar"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Train Avatar</h4>
                <p className="text-sm text-gray-500">Setup your AI avatar</p>
              </div>
            </Link>

            <Link
              to="/interviewer/candidates"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View Analytics</h4>
                <p className="text-sm text-gray-500">Review candidate scores</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
