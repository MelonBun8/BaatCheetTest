import React from 'react';
import { useWebRTC } from '../context/webRTCContext';

const CallNotification = () => {
  const { 
    callStatus, 
    activeCall, 
    answerCall, 
    endCall 
  } = useWebRTC();

  if (callStatus !== 'incoming') return null;

  return (
    <div className="call-notification-overlay">
      <div className="call-notification">
        <h3>Incoming Call</h3>
        <p>{activeCall.callerName} is calling you</p>
        
        <div className="call-notification-buttons">
          <button onClick={answerCall} className="accept-button">
            Accept
          </button>
          <button onClick={endCall} className="reject-button">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;