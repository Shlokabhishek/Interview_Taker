import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const AuthContext = createContext(null);

const mapAuthUserToAppUser = (authUser) => {
  if (!authUser) return null;

  const metadata = authUser.user_metadata || {};

  return {
    id: authUser.id,
    email: authUser.email || '',
    name: metadata.name || authUser.email?.split('@')?.[0] || 'Interviewer',
    role: metadata.role || 'interviewer',
    company: metadata.company || '',
    avatarConfig: metadata.avatarConfig || null,
    avatarTrained: Boolean(metadata.avatarTrained),
    rawUserMetadata: metadata,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (mounted) {
        if (sessionError) {
          setError(sessionError.message || 'Unable to initialize authentication');
        }
        setUser(mapAuthUserToAppUser(data?.session?.user || null));
        setLoading(false);
      }
    };

    initializeAuth();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(mapAuthUserToAppUser(session?.user || null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        const msg = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg = authError.message || 'Invalid email or password';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const signedInUser = mapAuthUserToAppUser(data?.user || null);
      setUser(signedInUser);
      setLoading(false);
      return { success: true, user: signedInUser };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        const msg = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            company: userData.company,
            role: 'interviewer',
          },
        },
      });

      if (authError) {
        const msg = authError.message || 'Registration failed';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const registeredUser = mapAuthUserToAppUser(data?.user || null);

      // If email confirmation is enabled in Supabase, session can be null right after sign-up.
      const requiresEmailConfirmation = !data?.session;
      if (!requiresEmailConfirmation && registeredUser) {
        setUser(registeredUser);
      }

      setLoading(false);
      return {
        success: true,
        user: registeredUser,
        requiresEmailConfirmation,
        message: requiresEmailConfirmation
          ? 'Check your email to confirm your account, then sign in.'
          : '',
      };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'No authenticated user' };

    const nextUser = { ...user, ...updates };
    setUser(nextUser);

    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const mergedMetadata = {
      ...(user.rawUserMetadata || {}),
      ...(updates?.name !== undefined ? { name: updates.name } : {}),
      ...(updates?.company !== undefined ? { company: updates.company } : {}),
      ...(updates?.avatarConfig !== undefined ? { avatarConfig: updates.avatarConfig } : {}),
      ...(updates?.avatarTrained !== undefined ? { avatarTrained: updates.avatarTrained } : {}),
    };

    const { data, error: profileError } = await supabase.auth.updateUser({
      ...(updates?.email ? { email: updates.email } : {}),
      data: mergedMetadata,
    });

    if (profileError) {
      setError(profileError.message || 'Failed to update profile');
      setUser(user);
      return { success: false, error: profileError.message || 'Failed to update profile' };
    }

    const refreshedUser = mapAuthUserToAppUser(data?.user || null) || nextUser;
    setUser(refreshedUser);
    return { success: true, user: refreshedUser };
  }, [user]);

  const changePassword = useCallback(async (newPassword) => {
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    if (passwordError) {
      setError(passwordError.message || 'Unable to update password');
      return { success: false, error: passwordError.message || 'Unable to update password' };
    }

    return { success: true };
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isInterviewer: user?.role === 'interviewer',
    isSupabaseConfigured,
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
