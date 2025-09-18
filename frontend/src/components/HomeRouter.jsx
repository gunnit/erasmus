import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';

const HomeRouter = () => {
  const { user } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

export default HomeRouter;