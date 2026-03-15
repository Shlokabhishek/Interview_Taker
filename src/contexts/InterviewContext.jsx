import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storage, generateId, generateInterviewLink } from '../utils/helpers';
import { useAuth } from './AuthContext';

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load candidates from storage (used by both candidate and interviewer flows)
  useEffect(() => {
    const storedCandidates = storage.get('allCandidates') || [];
    setCandidates(storedCandidates);
  }, []);

  // Load sessions from storage (interviewer-only)
  useEffect(() => {
    if (!user?.id) return;
    const storedSessions = storage.get(`sessions_${user.id}`) || [];
    setSessions(storedSessions);
  }, [user?.id]);

  // Sync across tabs/windows (localStorage "storage" event only fires in other tabs)
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'allCandidates') {
        setCandidates(storage.get('allCandidates') || []);
      }

      if (user?.id && event.key === `sessions_${user.id}`) {
        setSessions(storage.get(`sessions_${user.id}`) || []);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.id]);

  // Save sessions to storage
  const saveSessions = useCallback((newSessions) => {
    if (user?.id) {
      storage.set(`sessions_${user.id}`, newSessions);
      setSessions(newSessions);
    }
  }, [user?.id]);

  // Create new interview session
  const createSession = useCallback((sessionData) => {
    const newSession = {
      id: generateId(),
      interviewerId: user?.id,
      interviewerName: user?.name,
      link: generateInterviewLink(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [],
      candidates: [],
      settings: {
        totalDuration: 30,
        allowLateEntry: true,
        showTimer: true,
        recordVideo: true,
        recordAudio: true,
      },
      avatarConfig: null,
      ...sessionData,
    };

    const updatedSessions = [...sessions, newSession];
    saveSessions(updatedSessions);
    return newSession;
  }, [sessions, saveSessions, user]);

  // Update session
  const updateSession = useCallback((sessionId, updates) => {
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates, updatedAt: new Date().toISOString() }
        : session
    );
    saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession({ ...currentSession, ...updates });
    }
  }, [sessions, currentSession, saveSessions]);

  // Delete session
  const deleteSession = useCallback((sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [sessions, currentSession, saveSessions]);

  // Add question to session
  const addQuestion = useCallback((sessionId, question) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newQuestion = {
      id: generateId(),
      order: session.questions.length + 1,
      createdAt: new Date().toISOString(),
      ...question,
    };

    updateSession(sessionId, {
      questions: [...session.questions, newQuestion],
    });

    return newQuestion;
  }, [sessions, updateSession]);

  // Update question
  const updateQuestion = useCallback((sessionId, questionId, updates) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedQuestions = session.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );

    updateSession(sessionId, { questions: updatedQuestions });
  }, [sessions, updateSession]);

  // Delete question
  const deleteQuestion = useCallback((sessionId, questionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedQuestions = session.questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index + 1 }));

    updateSession(sessionId, { questions: updatedQuestions });
  }, [sessions, updateSession]);

  // Reorder questions
  const reorderQuestions = useCallback((sessionId, questionIds) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const reorderedQuestions = questionIds.map((id, index) => {
      const question = session.questions.find(q => q.id === id);
      return question ? { ...question, order: index + 1 } : null;
    }).filter(Boolean);

    updateSession(sessionId, { questions: reorderedQuestions });
  }, [sessions, updateSession]);

  // Get session by link
  const getSessionByLink = useCallback((link) => {
    // Search in all sessions across all users
    const allSessionsKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sessions_')
    );
    
    for (const key of allSessionsKeys) {
      const userSessions = storage.get(key) || [];
      const session = userSessions.find(s => s.link === link);
      if (session) return session;
    }
    
    return null;
  }, []);

  // Add candidate to session
  const addCandidate = useCallback((candidateData) => {
    const newCandidate = {
      id: generateId(),
      status: 'registered',
      registeredAt: new Date().toISOString(),
      responses: [],
      analysis: null,
      overallScore: null,
      ...candidateData,
    };

    setCandidates((prev) => {
      const updatedCandidates = [...prev, newCandidate];
      storage.set('allCandidates', updatedCandidates);
      return updatedCandidates;
    });

    return newCandidate;
  }, []);

  // Update candidate
  const updateCandidate = useCallback((candidateId, updates) => {
    setCandidates((prev) => {
      const updatedCandidates = prev.map(c =>
        c.id === candidateId ? { ...c, ...updates } : c
      );
      storage.set('allCandidates', updatedCandidates);
      return updatedCandidates;
    });
  }, []);

  // Get candidates for session
  const getCandidatesForSession = useCallback((sessionId) => {
    return candidates.filter(c => c.sessionId === sessionId);
  }, [candidates]);

  // Publish session (make it active)
  const publishSession = useCallback((sessionId) => {
    updateSession(sessionId, { status: 'active' });
  }, [updateSession]);

  // Close session
  const closeSession = useCallback((sessionId) => {
    updateSession(sessionId, { status: 'closed' });
  }, [updateSession]);

  // Save avatar configuration
  const saveAvatarConfig = useCallback((sessionId, avatarConfig) => {
    updateSession(sessionId, { avatarConfig });
  }, [updateSession]);

  const value = {
    sessions,
    currentSession,
    candidates,
    loading,
    setCurrentSession,
    createSession,
    updateSession,
    deleteSession,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    getSessionByLink,
    addCandidate,
    updateCandidate,
    getCandidatesForSession,
    publishSession,
    closeSession,
    saveAvatarConfig,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export default InterviewContext;
