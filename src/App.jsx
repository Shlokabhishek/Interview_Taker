import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  Login,
  Register,
  CandidateRegistration,
  InterviewRoom,
  InterviewComplete
} from './pages';

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route index element={<LandingPage />} />
      <Route path="/" element={<LandingPage />} />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Interviewer Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/sessions" 
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/sessions" 
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/sessions/create" 
        element={
          <ProtectedRoute>
            <CreateSession />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/sessions/new" 
        element={
          <ProtectedRoute>
            <CreateSession />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/sessions/:id" 
        element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/sessions/:id" 
        element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/avatar-training" 
        element={
          <ProtectedRoute>
            <AvatarTraining />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/avatar" 
        element={
          <ProtectedRoute>
            <AvatarTraining />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/candidates" 
        element={
          <ProtectedRoute>
            <Candidates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/candidates" 
        element={
          <ProtectedRoute>
            <Candidates />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/interviewer/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* Candidate Routes (Public) */}
      <Route path="/interview/:link" element={<CandidateRegistration />} />
      <Route path="/interview/:link/room" element={<InterviewRoom />} />
      <Route path="/interview/:link/complete" element={<InterviewComplete />} />

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
