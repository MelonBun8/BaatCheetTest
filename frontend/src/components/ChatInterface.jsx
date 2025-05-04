import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../context/webRTCContext';
import { useAuth } from '../context/AuthContext';

const ChatInterface = () => {
  const { user } = useAuth();
  const { chatMessages, sendChatMessage, activeCall, callStatus } = useWebRTC();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && activeCall && callStatus === 'ongoing') {
      sendChatMessage(message);
      setMessage('');
    }
  };

  // Function to get peer name
  const getPeerName = () => {
    if (!activeCall) return 'User';
    
    return activeCall.initiator 
      ? activeCall.recipientName || 'User'
      : activeCall.callerName || 'User';
  };

  if (!activeCall) {
    return (
      <div className="chat-container">
        <div className="chat-placeholder">
          <p>Start a call to begin chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {getPeerName()}</h3>
      </div>
      
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <p className="no-messages">No messages yet</p>
        ) : (
          chatMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <div className="message-sender">{msg.senderId === user.id ? 'You' : msg.senderName}</div>
                <div className="message-text">{msg.text}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={callStatus !== 'ongoing'}
        />
        <button 
          type="submit" 
          disabled={!message.trim() || callStatus !== 'ongoing'}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;