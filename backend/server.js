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
const cors = require('cors');
const User = require('./models/User');

dotenv.config();

connectDB();

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
  origin: [process.env.FRONTEND_URL, 'http://localhost:8080', 'https://preview--quluub-reborn-project-99.lovable.app'].filter(Boolean),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(httpServer, {
  cors: corsOptions,
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
app.use('/wali', waliRoutes);
app.use('/api/feed', feedRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
