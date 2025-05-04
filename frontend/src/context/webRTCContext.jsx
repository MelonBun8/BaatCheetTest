import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebRTCContext = createContext();

export const WebRTCProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'calling', 'incoming', 'ongoing'
  const [activeCall, setActiveCall] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  
  const ws = useRef(null);
  const pc = useRef(null);
  const connectionCheckTimer = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) return;

    // Close any existing connection
    if (ws.current) {
      ws.current.close();
    }

    // Create new WebSocket connection
    const socketUrl = `ws://localhost:5000?token=${token}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
      setConnectionError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data.type);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnectionError('WebSocket connection closed. Please refresh the page.');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('WebSocket connection error. Please check your network connection.');
    };

    // Clean up function
    return () => {
      if (connectionCheckTimer.current) {
        clearInterval(connectionCheckTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
      closeMediaAndResetCall();
    };
  }, [user, token]);

  // Setup ping interval to keep connection alive
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      connectionCheckTimer.current = setInterval(() => {
        try {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (connectionCheckTimer.current) {
        clearInterval(connectionCheckTimer.current);
      }
    };
  }, [ws.current]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'online-users':
        console.log('Online users updated:', data.users);
        setOnlineUsers(data.users);
        break;
      case 'offer':
        console.log('Received call offer from:', data.callerId);
        handleIncomingCall(data);
        break;
      case 'answer':
        console.log('Received call answer');
        handleAnswer(data);
        break;
      case 'candidate':
        handleCandidate(data);
        break;
      case 'chat':
        handleIncomingChat(data);
        break;
      case 'end-call':
        handleRemoteEndCall();
        break;
      case 'busy':
        handleBusySignal();
        break;
      case 'pong':
        // Silent handling of pong responses
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const startCall = async (recipientId, recipientName) => {
    if (callStatus !== 'idle') {
      console.log('Cannot start call: call status is', callStatus);
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setConnectionError('WebSocket not connected. Please refresh the page.');
      return;
    }

    try {
      console.log(`Starting call to user ${recipientId} (${recipientName})`);
      setCallStatus('calling');
      setActiveCall({ 
        recipientId, 
        recipientName, 
        initiator: true 
      });
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      // Create peer connection
      pc.current = createPeerConnection();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.current.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      
      ws.current.send(JSON.stringify({
        type: 'offer',
        sdp: pc.current.localDescription.sdp,
        recipientId,
        callerName: user.name
      }));
      
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call: ' + error.message);
      endCall();
    }
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
        // Add TURN servers here if needed for production
      ]
    });

    peerConnection.onicecandidate = handleICECandidate;
    peerConnection.ontrack = handleTrack;
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed' || 
          peerConnection.iceConnectionState === 'disconnected') {
        console.warn('ICE connection failed or disconnected');
        // Could implement reconnection logic here
      }
    };

    return peerConnection;
  };

  const handleIncomingCall = async (data) => {
    if (callStatus !== 'idle') {
      // Send busy signal if already in a call
      ws.current.send(JSON.stringify({
        type: 'busy',
        recipientId: data.callerId
      }));
      return;
    }

    console.log('Handling incoming call from', data.callerName);
    setCallStatus('incoming');
    setActiveCall({
      callerId: data.callerId,
      callerName: data.callerName,
      initiator: false
    });

    try {
      // Create peer connection for incoming call
      pc.current = createPeerConnection();

      // Set remote description from offer
      await pc.current.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: data.sdp
      }));
    } catch (error) {
      console.error('Error handling incoming call:', error);
      endCall();
    }
  };

  const answerCall = async () => {
    if (callStatus !== 'incoming' || !pc.current) {
      console.log('Cannot answer call: invalid state');
      return;
    }

    try {
      console.log('Answering call');
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.current.addTrack(track, stream);
      });

      // Create and send answer
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      ws.current.send(JSON.stringify({
        type: 'answer',
        sdp: pc.current.localDescription.sdp,
        recipientId: activeCall.callerId
      }));

      setCallStatus('ongoing');
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Failed to answer call: ' + error.message);
      endCall();
    }
  };

  const closeMediaAndResetCall = () => {
    // Close peer connection if it exists
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    setChatMessages([]);
    setCallStatus('idle');
    setActiveCall(null);
  };

  const endCall = () => {
    console.log('Ending call');
    
    // Notify other participant if call was active
    if (activeCall && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const recipientId = activeCall.initiator ? 
        activeCall.recipientId : activeCall.callerId;
      
      ws.current.send(JSON.stringify({
        type: 'end-call',
        recipientId
      }));
    }
    
    closeMediaAndResetCall();
  };

  const handleRemoteEndCall = () => {
    console.log('Remote participant ended the call');
    if (callStatus === 'ongoing' || callStatus === 'calling') {
      alert('The other participant has ended the call');
    }
    closeMediaAndResetCall();
  };

  const handleBusySignal = () => {
    console.log('Received busy signal');
    if (callStatus === 'calling') {
      alert('The user is busy in another call');
      closeMediaAndResetCall();
    }
  };

  const handleAnswer = async (data) => {
    if (!pc.current || callStatus !== 'calling') {
      console.log('Cannot handle answer: invalid state');
      return;
    }
    
    try {
      console.log('Handling call answer');
      await pc.current.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: data.sdp
      }));
      setCallStatus('ongoing');
    } catch (error) {
      console.error('Error handling answer:', error);
      endCall();
    }
  };

  const handleCandidate = (data) => {
    if (pc.current && data.candidate) {
      try {
        pc.current.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(e => console.error('Error adding ICE candidate:', e));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const handleTrack = (event) => {
    console.log('Remote track received', event);
    if (event.streams && event.streams[0]) {
      console.log('Setting remote stream');
      setRemoteStream(event.streams[0]);
    }
  };

  const handleICECandidate = (event) => {
    if (event.candidate && activeCall && ws.current) {
      const recipientId = activeCall.initiator ? 
        activeCall.recipientId : activeCall.callerId;
      
      ws.current.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate,
        recipientId
      }));
    }
  };

  const sendChatMessage = (messageText) => {
    if (!activeCall || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.log('Cannot send message: no active call or WebSocket');
      return;
    }
    
    const recipientId = activeCall.initiator ? 
      activeCall.recipientId : activeCall.callerId;
    
    const message = {
      type: 'chat',
      text: messageText,
      senderId: user.id,
      senderName: user.name,
      recipientId,
      timestamp: new Date().toISOString()
    };
    
    ws.current.send(JSON.stringify(message));
    
    // Add message to local chat history
    setChatMessages(prev => [...prev, message]);
  };

  const handleIncomingChat = (data) => {
    console.log('Received chat message:', data);
    setChatMessages(prev => [...prev, data]);
  };

  const value = {
    localStream,
    remoteStream,
    callStatus,
    activeCall,
    chatMessages,
    onlineUsers,
    connectionError,
    startCall,
    answerCall,
    endCall,
    sendChatMessage
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};