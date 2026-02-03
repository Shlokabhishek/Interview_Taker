import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, generateId } from '../utils/helpers';

const AuthContext = createContext(null);

// Mock users for demo
const DEMO_USERS = [
  {
    id: 'hr-1',
    email: 'hr@company.com',
    password: 'demo123',
    name: 'Sarah Johnson',
    role: 'interviewer',
    company: 'TechCorp Inc.',
    avatar: null,
  },
  {
    id: 'hr-2',
    email: 'admin@company.com',
    password: 'demo123',
    name: 'Michael Chen',
    role: 'interviewer',
    company: 'TechCorp Inc.',
    avatar: null,
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    const storedUser = storage.get('currentUser');
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (email, password, role = 'interviewer') => {
    setError(null);
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check demo users
      const demoUser = DEMO_USERS.find(
        u => u.email === email && u.password === password
      );

      if (demoUser) {
        const userData = { ...demoUser };
        delete userData.password;
        setUser(userData);
        storage.set('currentUser', userData);
        setLoading(false);
        return { success: true, user: userData };
      }

      // Check registered users in storage
      const registeredUsers = storage.get('registeredUsers') || [];
      const registeredUser = registeredUsers.find(
        u => u.email === email && u.password === password
      );

      if (registeredUser) {
        const userData = { ...registeredUser };
        delete userData.password;
        setUser(userData);
        storage.set('currentUser', userData);
        setLoading(false);
        return { success: true, user: userData };
      }

      setError('Invalid email or password');
      setLoading(false);
      return { success: false, error: 'Invalid email or password' };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const registeredUsers = storage.get('registeredUsers') || [];
      
      // Check if email already exists
      if (registeredUsers.find(u => u.email === userData.email)) {
        setError('Email already registered');
        setLoading(false);
        return { success: false, error: 'Email already registered' };
      }

      const newUser = {
        id: generateId(),
        ...userData,
        role: 'interviewer',
        createdAt: new Date().toISOString(),
      };

      registeredUsers.push(newUser);
      storage.set('registeredUsers', registeredUsers);

      // Auto login after registration
      const loginUser = { ...newUser };
      delete loginUser.password;
      setUser(loginUser);
      storage.set('currentUser', loginUser);

      setLoading(false);
      return { success: true, user: loginUser };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    storage.remove('currentUser');
  }, []);

  // Update user profile
  const updateProfile = useCallback((updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    storage.set('currentUser', updatedUser);

    // Also update in registered users if applicable
    const registeredUsers = storage.get('registeredUsers') || [];
    const userIndex = registeredUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...updates };
      storage.set('registeredUsers', registeredUsers);
    }
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!user,
    isInterviewer: user?.role === 'interviewer',
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
