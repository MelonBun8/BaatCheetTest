import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WebRTCProvider } from './context/webRTCContext'
import './assets/styles/main.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <WebRTCProvider> {/* This must wrap all components using useWebRTC */}
        <App />
      </WebRTCProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);