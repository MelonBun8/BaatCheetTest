import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // The actual handling of the Google OAuth callback happens in AuthContext
    // This component just handles redirection after the auth state is updated
    
    // If authentication is successful, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h2>Processing your login...</h2>
      <div className="loading-spinner"></div>
    </div>
  );
};

export default GoogleCallbackPage;