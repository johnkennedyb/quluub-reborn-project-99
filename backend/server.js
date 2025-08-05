const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler_fixed');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const emailRoutes = require('./routes/emailRoutes');
const matchNotificationRoutes = require('./routes/matchNotificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const referralRoutes = require('./routes/referralRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const wherebyRoutes = require('./routes/wherebyRoutes');
const waliRoutes = require('./routes/waliRoutes');
const feedRoutes = require('./routes/feedRoutes');
const profileTestRoutes = require('./routes/profileTestRoutes');
const videoCallTestRoutes = require('./routes/videoCallTestRoutes');
const monthlyUsageRoutes = require('./routes/monthlyUsageRoutes');
const cors = require('cors');
const User = require('./models/User');

dotenv.config();

connectDB();

const { ExpressPeerServer } = require('peer');
const app = express();
const server = http.createServer(app);

const peerServer = ExpressPeerServer(server, {
  debug: false,
  path: '/'
});

app.use('/peerjs', peerServer);

const corsOptions = {
  origin: [process.env.FRONTEND_URL, 'http://localhost:8080', 'https://preview--quluub-reborn-project-99.lovable.app'].filter(Boolean),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'], // Start with polling, allow websocket upgrade
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 30000, // 30 seconds for upgrade
  maxHttpBufferSize: 1e6, // 1MB
  allowRequest: (req, callback) => {
    // Allow all requests for now
    callback(null, true);
  },
});

// Attach Socket.IO instance to Express app for route access
app.set('io', io);

// Create WebRTC namespace for video call functionality
const webrtcNamespace = io.of('/webrtc');

let onlineUsers = new Map();
let webrtcUsers = new Map();

// Socket.IO authentication middleware for main namespace
io.use(async (socket, next) => {
  // Allow main namespace connections without strict auth for now
  next();
});

// Socket.IO authentication middleware for WebRTC namespace
webrtcNamespace.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    console.log('✅ Socket authenticated for user:', user.fname, user._id);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Main namespace connection (for general app functionality)
io.on('connection', (socket) => {
  console.log('🔗 Main socket connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    console.log(`🏠 User ${userId} joined main room with socket ${socket.id}`);
    console.log(`👥 Total online users: ${onlineUsers.size}`);
    console.log(`📋 Online users list:`, Array.from(onlineUsers.entries()));
  });

  // Video Call Invitation Handlers
  socket.on('send-video-call-invitation', (data) => {
    console.log('📞 Video call invitation from', data.callerName, 'to', data.recipientId);
    console.log('📄 Full invitation data:', JSON.stringify(data, null, 2));
    console.log('👥 Current online users:', Array.from(onlineUsers.keys()));
    console.log('🗺️ Online users map:', Array.from(onlineUsers.entries()));
    
    // Check if recipient is online
    const recipientSocketId = onlineUsers.get(data.recipientId);
    console.log('🔍 Looking for recipient socket ID:', recipientSocketId);
    console.log('🔍 Recipient ID type:', typeof data.recipientId);
    console.log('🔍 Caller ID type:', typeof data.callerId);
    
    if (recipientSocketId) {
      console.log('✅ Recipient is online, sending invitation to socket:', recipientSocketId);
      console.log('📡 Sending video call invitation as chat message...');
      
      // Send video call invitation as a chat message
      const videoCallMessage = {
        senderId: data.callerId,
        recipientId: data.recipientId,
        message: `${data.callerName} is inviting you to a video call`,
        messageType: 'video_call_invitation',
        videoCallData: {
          callerId: data.callerId,
          callerName: data.callerName,
          sessionId: data.sessionId,
          timestamp: data.timestamp,
          status: 'pending'
        },
        createdAt: new Date().toISOString()
      };
      
      // Emit as a new message to both users
      io.to(data.callerId).emit('new_message', videoCallMessage);
      io.to(data.recipientId).emit('new_message', videoCallMessage);
      
      // Direct popup notification event for recipient
      io.to(data.recipientId).emit('video_call_invitation', videoCallMessage);
      
      // Also emit to recipient's socket directly
      io.to(recipientSocketId).emit('video_call_invitation', videoCallMessage);
      io.to(recipientSocketId).emit('new_message', videoCallMessage);
      
      console.log('✅ Video call invitation sent as chat message');
      console.log('📤 Sent to caller room:', data.callerId);
      console.log('📤 Sent to recipient room:', data.recipientId);
      console.log('📤 Sent to recipient socket:', recipientSocketId);
    } else {
      console.log('❌ Recipient is not online:', data.recipientId);
      console.log('👥 Available online users:', Array.from(onlineUsers.entries()));
      console.log('🔍 Searching for similar user IDs...');
      
      // Try to find similar user IDs (in case of string vs ObjectId issues)
      const similarUsers = Array.from(onlineUsers.keys()).filter(userId => 
        userId.toString().includes(data.recipientId.toString()) || 
        data.recipientId.toString().includes(userId.toString())
      );
      console.log('🔍 Similar user IDs found:', similarUsers);
      
      socket.emit('video-call-failed', { 
        message: 'Recipient is not online',
        recipientId: data.recipientId,
        onlineUsers: Array.from(onlineUsers.keys()),
        similarUsers
      });
    }
  });

  socket.on('accept-video-call', (data) => {
    console.log('✅ Video call accepted by', data.recipientId, 'for caller', data.callerId);
    io.to(data.callerId).emit('video-call-accepted', {
      callerId: data.callerId,
      recipientId: data.recipientId,
      sessionId: data.sessionId
    });
  });

  socket.on('decline-video-call', (data) => {
    console.log('❌ Video call declined by', data.recipientId, 'for caller', data.callerId);
    io.to(data.callerId).emit('video-call-declined', {
      callerId: data.callerId,
      recipientId: data.recipientId,
      sessionId: data.sessionId
    });
  });

  socket.on('end-video-call', (data) => {
    console.log('📞 Video call ended:', data.sessionId);
    // Notify both participants
    io.to(data.callerId).emit('video-call-ended', {
      sessionId: data.sessionId,
      endedBy: data.callerId === data.callerId ? 'caller' : 'recipient'
    });
    io.to(data.recipientId).emit('video-call-ended', {
      sessionId: data.sessionId,
      endedBy: data.callerId === data.callerId ? 'caller' : 'recipient'
    });
  });

  // Handle new messages (including video call invitations)
  socket.on('new_message', async (data) => {
    console.log('📨 New message received:', data);
    console.log('📄 Message type:', data.messageType);
    console.log('👤 From:', data.senderId, 'To:', data.recipientId);
    
    try {
      // Save video call invitation messages to database for persistence
      if (data.messageType === 'video_call_invitation') {
        console.log('💾 Saving video call invitation to database...');
        
        // Find or create conversation between sender and recipient
        let conversation = await Conversation.findOne({
          $or: [
            { user1: data.senderId, user2: data.recipientId },
            { user1: data.recipientId, user2: data.senderId }
          ]
        });
        
        if (!conversation) {
          conversation = new Conversation({
            user1: data.senderId,
            user2: data.recipientId
          });
          await conversation.save();
          console.log('🆕 Created new conversation:', conversation._id);
        }
        
        // Create and save the video call invitation message
        const message = new Message({
          conversationId: conversation._id,
          senderId: data.senderId,
          message: data.message,
          messageType: data.messageType,
          videoCallData: data.videoCallData,
          createdAt: data.createdAt || new Date()
        });
        
        await message.save();
        console.log('✅ Video call invitation saved to database:', message._id);
        
        // Update the data with the saved message ID
        data._id = message._id;
        data.conversationId = conversation._id;
      }
    } catch (error) {
      console.error('❌ Error saving video call invitation to database:', error);
    }
    
    // Check if recipient is online
    const recipientSocketId = onlineUsers.get(data.recipientId);
    
    if (recipientSocketId) {
      console.log('✅ Recipient is online, sending message to socket:', recipientSocketId);
      // Send to recipient
      io.to(recipientSocketId).emit('new_message', data);
    } else {
      console.log('❌ Recipient is offline:', data.recipientId);
    }
    
    // Also send back to sender for confirmation
    socket.emit('new_message', data);
    console.log('📤 Message sent to both sender and recipient');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Main socket disconnected:', socket.id);
    // Remove from online users
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });
});

// WebRTC namespace connection (for video call functionality)
webrtcNamespace.on('connection', (socket) => {
  console.log('📹 WebRTC socket connected:', socket.id, 'User ID:', socket.userId);

  socket.on('join', (userId) => {
    // Use authenticated user ID for security
    const authenticatedUserId = socket.userId;
    socket.join(authenticatedUserId);
    webrtcUsers.set(authenticatedUserId, socket.id);
    console.log(`🏠 User ${socket.user.fname} (${authenticatedUserId}) joined WebRTC room with socket ${socket.id}`);
  });

  // WebRTC Signaling Handlers
  socket.on('video-call-offer', (data) => {
    console.log('📞 Video call offer from', socket.user.fname, '(', socket.userId, ') to', data.recipientId);
    
    // Check if recipient is online in WebRTC namespace
    const recipientSocketId = webrtcUsers.get(data.recipientId);
    if (recipientSocketId) {
      console.log('✅ Recipient is online in WebRTC, sending offer to socket:', recipientSocketId);
      socket.to(data.recipientId).emit('video-call-offer', {
        offer: data.offer,
        callerId: socket.userId, // Use authenticated caller ID
        callerName: data.callerName,
        callerAvatar: data.callerAvatar
      });
    } else {
      console.log('❌ Recipient is not online in WebRTC namespace:', data.recipientId);
      socket.emit('video-call-failed', { message: 'Recipient is not online' });
    }
  });

  socket.on('video-call-answer', (data) => {
    console.log('Video call answer from', data.recipientId, 'to', data.callerId);
    socket.to(data.callerId).emit('video-call-answer', {
      answer: data.answer,
      recipientId: data.recipientId
    });
  });

  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate from', data.senderId, 'to', data.recipientId);
    socket.to(data.recipientId).emit('ice-candidate', {
      candidate: data.candidate,
      senderId: data.senderId
    });
  });

  socket.on('video-call-reject', (data) => {
    console.log('Video call rejected by', data.recipientId);
    socket.to(data.callerId).emit('video-call-rejected', {
      recipientId: data.recipientId
    });
  });

  socket.on('video-call-end', (data) => {
    console.log('Video call ended by', data.userId);
    socket.to(data.recipientId).emit('video-call-ended', {
      userId: data.userId
    });
  });

  socket.on('video-call-cancel', (data) => {
    console.log('Video call cancelled by', data.callerId);
    socket.to(data.recipientId).emit('video-call-cancelled', {
      callerId: data.callerId
    });
  });

  socket.on('disconnect', async () => {
    console.log('🔌 WebRTC user disconnected:', socket.id);
    let userIdToUpdate;
    for (let [userId, socketId] of webrtcUsers.entries()) {
      if (socketId === socket.id) {
        userIdToUpdate = userId;
        webrtcUsers.delete(userId);
        break;
      }
    }

    if (userIdToUpdate) {
      try {
        await User.findByIdAndUpdate(userIdToUpdate, { lastSeen: new Date() });
        console.log(`🕰️ Updated lastSeen for WebRTC user ${userIdToUpdate}`);
      } catch (error) {
        console.error('Failed to update lastSeen on disconnect:', error);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin/match-notifications', matchNotificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/whereby', wherebyRoutes);
app.use('/api/zoom', require('./routes/zoomRoutes'));
app.use('/api/zoom', videoCallTestRoutes);
app.use('/api/video-calls', require('./routes/videoRecordingRoutes'));
app.use('/api/wali', waliRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/test', profileTestRoutes);
app.use('/api/monthly-usage', monthlyUsageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
