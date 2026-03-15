import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storage, generateId, generateInterviewLink, getApiBaseUrl } from '../utils/helpers';
import { useAuth } from './AuthContext';
import { apiFetchJson } from '../utils/apiClient';

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCandidates = useCallback(() => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      setCandidates(storage.get('allCandidates') || []);
      return;
    }

    apiFetchJson('/candidates')
      .then((remote) => setCandidates(Array.isArray(remote) ? remote : []))
      .catch(() => setCandidates(storage.get('allCandidates') || []));
  }, []);

  const refreshSessions = useCallback(() => {
    if (!user?.id) return;

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      setSessions(storage.get(`sessions_${user.id}`) || []);
      return;
    }

    apiFetchJson(`/sessions?interviewerId=${encodeURIComponent(user.id)}`)
      .then((remote) => setSessions(Array.isArray(remote) ? remote : []))
      .catch(() => setSessions(storage.get(`sessions_${user.id}`) || []));
  }, [user?.id]);

  // Load candidates from storage (used by both candidate and interviewer flows)
  useEffect(() => {
    refreshCandidates();
  }, []);

  // Load sessions from storage (interviewer-only)
  useEffect(() => {
    refreshSessions();
  }, [user?.id]);

  // Sync existing localStorage data to backend (helps old sessions/links work on other devices)
  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) return;

    try {
      const localCandidates = storage.get('allCandidates') || [];
      if (Array.isArray(localCandidates)) {
        localCandidates.forEach((c) => {
          if (c?.id) {
            apiFetchJson('/candidates', { method: 'POST', body: JSON.stringify(c) }).catch(() => {});
          }
        });
      }
    } catch (e) {}

    if (user?.id) {
      try {
        const localSessions = storage.get(`sessions_${user.id}`) || [];
        if (Array.isArray(localSessions)) {
          localSessions.forEach((s) => {
            if (s?.id) {
              apiFetchJson('/sessions', { method: 'POST', body: JSON.stringify(s) }).catch(() => {});
            }
          });
        }
      } catch (e) {}
    }
  }, [user?.id]);

  // Sync across tabs/windows (localStorage "storage" event only fires in other tabs)
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'allCandidates') {
        refreshCandidates();
      }

      if (user?.id && event.key === `sessions_${user.id}`) {
        refreshSessions();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.id]);

  // When returning to a tab, reload from storage in case we missed updates
  useEffect(() => {
    const onFocus = () => {
      refreshCandidates();
      refreshSessions();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCandidates();
        refreshSessions();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshCandidates, refreshSessions]);

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

    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      apiFetchJson('/sessions', { method: 'POST', body: JSON.stringify(newSession) }).catch(() => {});
    }

    const updatedSessions = [...sessions, newSession];
    saveSessions(updatedSessions);
    return newSession;
  }, [sessions, saveSessions, user]);

  // Update session
  const updateSession = useCallback((sessionId, updates) => {
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      apiFetchJson(`/sessions?id=${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: JSON.stringify(updates) }).catch(() => {});
    }

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
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      apiFetchJson(`/sessions?id=${encodeURIComponent(sessionId)}`, { method: 'DELETE' }).catch(() => {});
    }

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
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      // Async fetch isn't compatible with the existing call sites; return best-effort cache.
      // Candidate pages use this synchronously, so we keep local search and refresh in background.
      apiFetchJson(`/session-by-link?link=${encodeURIComponent(link)}`)
        .then((remote) => {
          if (remote?.id) {
            setSessions((prev) => {
              const exists = prev.some((s) => s.id === remote.id);
              return exists ? prev.map((s) => (s.id === remote.id ? remote : s)) : [...prev, remote];
            });
          }
        })
        .catch(() => {});
    }

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

  const fetchSessionByLink = useCallback(async (link) => {
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      try {
        const remote = await apiFetchJson(`/session-by-link?link=${encodeURIComponent(link)}`);
        if (remote?.id) {
          setSessions((prev) => {
            const exists = prev.some((s) => s.id === remote.id);
            return exists ? prev.map((s) => (s.id === remote.id ? remote : s)) : [...prev, remote];
          });
        }
        return remote || null;
      } catch (e) {
        // Fall back to localStorage-based lookup (useful in dev when no backend is running)
        return getSessionByLink(link);
      }
    }

    return getSessionByLink(link);
  }, [getSessionByLink]);

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

    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      apiFetchJson('/candidates', { method: 'POST', body: JSON.stringify(newCandidate) }).catch(() => {});
    }

    setCandidates((prev) => {
      const updatedCandidates = [...prev, newCandidate];
      storage.set('allCandidates', updatedCandidates);
      return updatedCandidates;
    });

    return newCandidate;
  }, []);

  // Update candidate
  const updateCandidate = useCallback((candidateId, updates) => {
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      apiFetchJson(`/candidates?id=${encodeURIComponent(candidateId)}`, { method: 'PATCH', body: JSON.stringify(updates) }).catch(() => {});
    }

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

  // Apply the interviewer's avatar config across their sessions (useful after training)
  const applyAvatarConfigToMySessions = useCallback((avatarConfig) => {
    if (!user?.id) return;

    const stored = storage.get(`sessions_${user.id}`) || [];
    const baseSessions = Array.isArray(stored) && stored.length ? stored : sessions;

    const updatedSessions = baseSessions.map((session) => {
      if (session.interviewerId && session.interviewerId !== user.id) return session;
      return { ...session, avatarConfig, updatedAt: new Date().toISOString() };
    });

    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl) {
      updatedSessions.forEach((session) => {
        if (session.interviewerId && session.interviewerId !== user.id) return;
        apiFetchJson(`/sessions?id=${encodeURIComponent(session.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ avatarConfig }),
        }).catch(() => {});
      });
    }

    saveSessions(updatedSessions);
  }, [saveSessions, sessions, user?.id]);

  const value = {
    sessions,
    currentSession,
    candidates,
    loading,
    refreshCandidates,
    refreshSessions,
    setCurrentSession,
    createSession,
    updateSession,
    deleteSession,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    getSessionByLink,
    fetchSessionByLink,
    addCandidate,
    updateCandidate,
    getCandidatesForSession,
    publishSession,
    closeSession,
    saveAvatarConfig,
    applyAvatarConfigToMySessions,
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
