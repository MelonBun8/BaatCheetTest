const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });
  const clients = new Map(); // Map<userId, {ws, userData}>

  wss.on('connection', async (ws, req) => {
    let token;
    try {
      // Extract token from URL
      const url = new URL(req.url, 'http://localhost');
      token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token missing');
        return;
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      // Get user data from database to include name
      const user = await User.findById(userId).select('name email');
      if (!user) {
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

      // Notify all clients about online users
      broadcastOnlineUsers();

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          handleMessage(userId, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`User disconnected: ${userId}`);
        broadcastOnlineUsers();
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Invalid token or server error');
    }
  });

  const handleMessage = (senderId, data) => {
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

    // Send the list to all connected clients
    clients.forEach(({ws}, userId) => {
      const otherUsers = onlineUsersArray.filter(user => user.id !== userId);
      ws.send(JSON.stringify({
        type: 'online-users',
        users: otherUsers
      }));
    });
  };
};

module.exports = setupWebSocketServer;