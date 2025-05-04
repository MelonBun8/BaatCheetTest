import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Register from '../components/Register';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

const RegisterPage = () => {
  const { register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState(null);

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
      await register(formData);
      setSuccessMessage('Registration successful! You can now login.');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      // Error is handled in the Auth context
    }
  };

  return (
    <div className="page-container">
      <h1 className="app-title">BaatCheet</h1>
      {successMessage && <Alert type="success" message={successMessage} />}
      <Register onSubmit={handleSubmit} loading={loading} error={error} />
      <p className="auth-redirect">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;