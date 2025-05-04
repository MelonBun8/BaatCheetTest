import React from 'react';
import { useAuth } from '../context/AuthContext';
import CallInterface from '../components/CallInterface';
import ChatInterface from '../components/ChatInterface';
import ContactList from '../components/ContactList';
import CallNotification from '../components/CallNotification';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="sidebar">
          <ContactList />
        </div>
        
        <div className="main-content">
          <div className="video-section">
            <CallInterface />
          </div>
          
          <div className="chat-section">
            <ChatInterface />
          </div>
        </div>
      </div>
      
      <CallNotification />
    </div>
  );
};

export default DashboardPage;