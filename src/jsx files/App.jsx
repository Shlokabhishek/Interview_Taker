import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';

// Import all pages
import {
  LandingPage,
  Dashboard,
  Sessions,
  CreateSession,
  SessionDetail,
  AvatarTraining,
  Candidates,
  Settings,
  CandidateRegistration,
  InterviewRoom,
  InterviewComplete
} from './pages';

// Import Phone Recording (not exported from pages/index)
import PhoneRecording from './pages/PhoneRecording';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route index element={<LandingPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/interviewer/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/interviewer/dashboard" replace />} />

      {/* Interviewer Routes */}
      <Route 
        path="/dashboard" 
        element={<Dashboard />} 
      />
      <Route 
        path="/interviewer/dashboard" 
        element={<Dashboard />} 
      />
      
      <Route 
        path="/sessions" 
        element={<Sessions />} 
      />
      <Route 
        path="/interviewer/sessions" 
        element={<Sessions />} 
      />
      
      <Route 
        path="/sessions/create" 
        element={<CreateSession />} 
      />
      <Route 
        path="/interviewer/sessions/new" 
        element={<CreateSession />} 
      />
      
      <Route 
        path="/sessions/:id" 
        element={<SessionDetail />} 
      />
      <Route 
        path="/interviewer/sessions/:id" 
        element={<SessionDetail />} 
      />
      <Route 
        path="/sessions/:id/edit" 
        element={<CreateSession />} 
      />
      <Route 
        path="/interviewer/sessions/:id/edit" 
        element={<CreateSession />} 
      />
      
      <Route 
        path="/avatar-training" 
        element={<AvatarTraining />} 
      />
      <Route 
        path="/interviewer/avatar-training" 
        element={<AvatarTraining />} 
      />
      <Route 
        path="/interviewer/avatar" 
        element={<AvatarTraining />} 
      />
      
      <Route 
        path="/candidates" 
        element={<Candidates />} 
      />
      <Route 
        path="/interviewer/candidates" 
        element={<Candidates />} 
      />
      
      <Route 
        path="/settings" 
        element={<Settings />} 
      />
      <Route 
        path="/interviewer/settings" 
        element={<Settings />} 
      />

      {/* Candidate Routes (Public) */}
      <Route path="/interview/:link" element={<CandidateRegistration />} />
      <Route path="/interview/:link/room" element={<InterviewRoom />} />
      <Route path="/interview/:link/complete" element={<InterviewComplete />} />

      {/* Phone Recording Route (Public) */}
      <Route path="/phone-recording/:sessionId" element={<PhoneRecording />} />

      {/* 404 Fallback */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <a 
                href="/" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Go back home
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <InterviewProvider>
            <AppRoutes />
          </InterviewProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
