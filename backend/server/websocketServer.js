const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const User = require('../models/UserModel');

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    // Add path for the WebSocket server to match client connection
    noServer: false,
    // Allow client to include credentials
    verifyClient: (info, cb) => {
      // Always accept the connection initially, we'll validate token after connection
      cb(true);
    }
  });
  
  const clients = new Map(); // Map<userId, {ws, userData}>

  wss.on('connection', async (ws, req) => {
    let token;
    try {
      // Extract token from URL query parameters
      const queryString = req.url.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      token = params.get('token');
      
      if (!token) {
        console.log('WebSocket connection attempt with missing token');
        ws.close(1008, 'Token missing');
        return;
      }
      
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      // Get user data from database
      const user = await User.findById(userId).select('name email');
      if (!user) {
        console.log('WebSocket connection attempt with valid token but user not found');
        ws.close(1008, 'User not found');
        return;
      }
      
      // Store both websocket and user data
      clients.set(userId, { 
        ws,
        userData: {
          id: userId,
          name: user.name,
          email: user.email
        }
      });
      
      console.log(`User connected: ${userId} (${user.name})`);

      // Notify all clients about online users immediately after connection
      broadcastOnlineUsers();

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Simple ping/pong for connection keep-alive
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          handleMessage(userId, data);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        clients.delete(userId);
        console.log(`User disconnected: ${userId}`);
        
        // Broadcast updated online users list
        broadcastOnlineUsers();
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Invalid token or server error');
    }
  });

  const handleMessage = (senderId, data) => {
    if (!data.type) {
      console.error('Message received with no type:', data);
      return;
    }
    
    console.log(`Received ${data.type} message from ${senderId}`);
    
    switch (data.type) {
      case 'offer':
        handleOffer(senderId, data);
        break;
      case 'answer':
        handleAnswer(senderId, data);
        break;
      case 'candidate':
        handleCandidate(senderId, data);
        break;
      case 'end-call':
        handleEndCall(senderId, data);
        break;
      case 'chat':
        handleChat(senderId, data);
        break;
      case 'busy':
        handleBusy(senderId, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleOffer = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      const senderData = clients.get(senderId)?.userData;
      recipientClient.ws.send(JSON.stringify({
        type: 'offer',
        sdp: data.sdp,
        callerId: senderId,
        callerName: senderData?.name || 'Unknown User'
      }));
      console.log(`Forwarded offer from ${senderId} to ${data.recipientId}`);
    } else {
      console.log(`Recipient ${data.recipientId} not found for offer`);
    }
  };

  const handleAnswer = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      recipientClient.ws.send(JSON.stringify({
        type: 'answer',
        sdp: data.sdp,
        answererId: senderId
      }));
      console.log(`Forwarded answer from ${senderId} to ${data.recipientId}`);
    } else {
      console.log(`Recipient ${data.recipientId} not found for answer`);
    }
  };

  const handleCandidate = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      recipientClient.ws.send(JSON.stringify({
        type: 'candidate',
        candidate: data.candidate,
        senderId
      }));
    }
  };

  const handleEndCall = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      recipientClient.ws.send(JSON.stringify({
        type: 'end-call',
        senderId
      }));
      console.log(`Forwarded end-call from ${senderId} to ${data.recipientId}`);
    }
  };

  const handleChat = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      const senderData = clients.get(senderId)?.userData;
      recipientClient.ws.send(JSON.stringify({
        ...data,
        senderId,
        senderName: senderData?.name || 'Unknown User'
      }));
      console.log(`Forwarded chat message from ${senderId} to ${data.recipientId}`);
    }
  };

  const handleBusy = (senderId, data) => {
    const recipientClient = clients.get(data.recipientId);
    if (recipientClient) {
      recipientClient.ws.send(JSON.stringify({
        type: 'busy',
        senderId
      }));
    }
  };

  const broadcastOnlineUsers = () => {
    // Prepare a list of online users with their data
    const onlineUsersArray = Array.from(clients.entries()).map(([userId, {userData}]) => ({
      id: userId,
      name: userData.name
    }));

    console.log(`Broadcasting online users: ${onlineUsersArray.length} users online`);

    // Send the list to all connected clients
    clients.forEach(({ws}, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        const otherUsers = onlineUsersArray.filter(user => user.id !== userId);
        ws.send(JSON.stringify({
          type: 'online-users',
          users: otherUsers
        }));
      }
    });
  };
  
  // Periodically broadcast online users to handle any sync issues
  setInterval(broadcastOnlineUsers, 30000);
};

module.exports = setupWebSocketServer;