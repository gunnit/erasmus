import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { extractErrorMessage } from '../utils/errorHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token is still valid
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { username, password });
      const { access_token, ...userData } = response.data;
      
      localStorage.setItem('access_token', access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { access_token, ...user } = response.data;
      
      localStorage.setItem('access_token', access_token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};