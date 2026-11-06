import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { getToken, setToken, clearToken } from '../services/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        // Token invalid or expired
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Stores the token where "remember me" says (localStorage vs sessionStorage) and sets the user
  const completeSignIn = (res, remember) => {
    if (res.token) setToken(res.token, remember);
    if (res.data?.user) setUser(res.data.user);
    return res;
  };

  const login = async (email, password, remember = false) => {
    setAuthError(null);
    try {
      const res = await authApi.login({ email, password, remember });
      return completeSignIn(res, remember);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async (credential, remember = false) => {
    setAuthError(null);
    try {
      const res = await authApi.googleSignIn(credential, remember);
      return completeSignIn(res, remember);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authApi.register(userData);
      // New accounts stay signed in on this device (server issues its JWT_EXPIRE token)
      return completeSignIn(res, true);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      clearToken();
      setUser(null);
      // Stop Google from silently picking the same account on the next visit
      window.google?.accounts?.id?.disableAutoSelect?.();
    }
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isWriter: user?.role === 'writer' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    clearError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
