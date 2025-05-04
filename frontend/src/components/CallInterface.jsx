import React, { useRef, useEffect } from 'react';
import { useWebRTC } from '../context/webRTCContext';

const CallInterface = () => {
  const {
    localStream,
    remoteStream,
    callStatus,
    activeCall,
    endCall,
    connectionError
  } = useWebRTC();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    return () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [remoteStream]);

  if (connectionError) {
    return (
      <div className="call-error">
        <p>{connectionError}</p>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  const renderCallStatus = () => {
    switch (callStatus) {
      case 'idle':
        return <p>No active call</p>;
      case 'calling':
        return <p>Calling {activeCall?.recipientName || 'user'}...</p>;
      case 'incoming':
        return <p>Incoming call from {activeCall?.callerName || 'user'}...</p>;
      case 'ongoing':
        return <p>In call with {
          activeCall?.initiator 
            ? activeCall?.recipientName || 'user' 
            : activeCall?.callerName || 'user'
        }</p>;
      default:
        return null;
    }
  };

  return (
    <div className="call-interface">
      <div className="call-status">{renderCallStatus()}</div>
      
      <div className="video-container">
        {remoteStream && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="remote-video"
          />
        )}
        
        {localStream && (
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="local-video"
          />
        )}
      </div>
      
      {(callStatus === 'calling' || callStatus === 'ongoing') && (
        <div className="call-controls">
          <button onClick={endCall} className="end-call-button">
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default CallInterface;