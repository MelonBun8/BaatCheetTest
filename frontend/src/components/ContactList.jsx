import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../context/webRTCContext';

const ContactList = () => {
  const { user } = useAuth();
  const { startCall, onlineUsers } = useWebRTC();
  
  const handleStartCall = (userId, userName) => {
    startCall(userId, userName);
  };

  return (
    <div className="contact-list">
      <h3>Online Users</h3>
      {onlineUsers.length === 0 ? (
        <p>No users online right now</p>
      ) : (
        <ul>
          {onlineUsers.map(onlineUser => (
            <li key={onlineUser.id} className="online">
              <span>{onlineUser.name || onlineUser.id}</span>
              <button 
                onClick={() => handleStartCall(onlineUser.id, onlineUser.name || 'User')}
                className="call-button"
              >
                Call
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactList;