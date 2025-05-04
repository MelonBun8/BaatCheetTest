import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Clear any existing errors when component mounts
    clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (formData) => {
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the Auth context
    }
  };

  return (
    <div className="page-container">
      <h1 className="app-title">BaatCheet</h1>
      <Login onSubmit={handleSubmit} loading={loading} error={error} />
      <p className="auth-redirect">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;