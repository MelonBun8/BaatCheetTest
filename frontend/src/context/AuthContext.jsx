import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../api/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authData = authService.getCurrentUser();
        if (authData) {
          setUser(authData.user);
          setToken(authData.token);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Don't set error here to avoid showing on initial load
      } finally {
        setInitialLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (formData) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(formData);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setActionLoading(false);
    }
  };

  const login = async (formData) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(formData);
      
      if (response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid response format from server');
      }
      
      return response;
    } catch (err) {
      // Handle different error formats
      let errorMessage = 'Login failed';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setActionLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading: actionLoading,
    initialLoading,
    error,
    login,
    register,
    logout,
    clearError
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