import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from './HomePage';

const HomeRouter = () => {
  const { user } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show landing page
  return <HomePage />;
};

export default HomeRouter;