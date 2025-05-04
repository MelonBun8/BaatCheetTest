import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Add auth token to requests
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
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
    
    if (response.data.token) {
      // Store token and user data properly
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
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
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (userStr && token) {
    try {
      const user = JSON.parse(userStr);
      setAuthToken(token);
      return { user, token };
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  }
  return null;
};

// Handle Google OAuth redirect
const handleGoogleCallback = (token, userStr) => {
  if (token && userStr) {
    try {
      const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
      return { user, token };
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return null;
    }
  }
  return null;
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

// Initialize with token if available
const initToken = () => {
  const token = localStorage.getItem('token');
  if (token && !isTokenExpired(token)) {
    setAuthToken(token);
  } else if (token) {
    // Token exists but is expired
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Initialize on import
initToken();

export default {
  register,
  login,
  logout,
  getCurrentUser,
  setAuthToken,
  handleGoogleCallback
};