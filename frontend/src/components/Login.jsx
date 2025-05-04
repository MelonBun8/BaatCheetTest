import React, { useState } from 'react';
import '../assets/styles/main.css';
import Alert from './Alert';
import GoogleAuthButton from './GoogleAuthButton';

const Login = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="auth-container">
      {error && <Alert type="error" message={error} />}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login to BaatCheet</h2>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <GoogleAuthButton isRegister={false} />
      </form>
    </div>
  );
};

export default Login;