import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Add auth token to requests
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Register user
const register = async (userData) => {
  try {
    const response = await api.post('/users/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

// Login user
const login = async (userData) => {
    try {
      const response = await api.post('/users/login', userData);
      // Store token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Store the entire response except token and message
        const { token, message, ...userData } = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Login failed');
    }
  };

// Logout user
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthToken(null);
};

// Get current authenticated user
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (user && token) {
    setAuthToken(token);
    return { user: JSON.parse(user), token };
  }
  return null;
};

// Handle Google OAuth redirect
const handleGoogleCallback = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthToken(token);
    return { user, token };
  }
  return null;
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  setAuthToken,
  handleGoogleCallback
};