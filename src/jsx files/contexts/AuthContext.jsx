import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '../services/app';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'local-interviewer',
  email: 'interviewer@local.app',
  name: 'Interviewer',
  role: 'interviewer',
  company: '',
  avatarConfig: null,
  avatarTrained: false,
};

const getStoredUser = () => ({
  ...DEFAULT_USER,
  ...(storage.get('localInterviewerProfile') || {}),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.set('localInterviewerProfile', user);
  }, [user]);

  const updateProfile = useCallback(async (updates) => {
    const nextUser = {
      ...getStoredUser(),
      ...updates,
      id: DEFAULT_USER.id,
      role: 'interviewer',
      avatarTrained: Boolean(updates?.avatarTrained ?? updates?.avatarConfig?.trainedAt ?? getStoredUser().avatarTrained),
    };

    setUser(nextUser);
    storage.set('localInterviewerProfile', nextUser);
    return { success: true, user: nextUser };
  }, []);

  const value = {
    user,
    loading,
    error: null,
    updateProfile,
    isAuthenticated: true,
    isInterviewer: true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
