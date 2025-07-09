
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

dotenv.config();

// Import with error handling
let connectDB, errorHandler, startScheduler;

try {
  ({ connectDB } = require('./config/db'));
} catch (err) {
  console.log('Database config not found, using fallback');
  connectDB = () => console.log('Database connection skipped');
}

try {
  ({ errorHandler } = require('./middlewares/errorHandler'));
} catch (err) {
  console.log('Error handler not found, using default');
  errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  };
}

try {
  ({ startScheduler } = require('./utils/emailScheduler'));
} catch (err) {
  console.log('Email scheduler not found, skipping');
  startScheduler = () => console.log('Email scheduler skipped');
}

connectDB();
startScheduler();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://quluub-reborn-project-33.vercel.app', 'https://quluub-reborn-project-33.onrender.com', 'http://localhost:8080', 'https://preview--quluub-reborn-project-99.lovable.app', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8083'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Add explicit preflight handling
app.options('*', cors(corsOptions));

const uploadsDir = path.join(__dirname, 'uploads');
const recordingsDir = path.join(uploadsDir, 'recordings');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import and load routes
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Loaded route: /api/auth');
} catch (err) {
  console.log('⚠️ Failed to load auth routes:', err.message);
}

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  console.log('✅ Loaded route: /api/users');
} catch (err) {
  console.log('⚠️ Failed to load user routes:', err.message);
}

try {
  const relationshipRoutes = require('./routes/relationshipRoutes');
  app.use('/api/relationships', relationshipRoutes);
  console.log('✅ Loaded route: /api/relationships');
} catch (err) {
  console.log('⚠️ Failed to load relationship routes:', err.message);
}

try {
  const chatRoutes = require('./routes/chatRoutes');
  app.use('/api/chats', chatRoutes);
  console.log('✅ Loaded route: /api/chats');
} catch (err) {
  console.log('⚠️ Failed to load chat routes:', err.message);
}

try {
  const referralRoutes = require('./routes/referralRoutes');
  app.use('/api/referrals', referralRoutes);
  console.log('✅ Loaded route: /api/referrals');
} catch (err) {
  console.log('⚠️ Failed to load referral routes:', err.message);
}

try {
  const adminRoutes = require('./routes/adminRoutes');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Loaded route: /api/admin');
} catch (err) {
  console.log('⚠️ Failed to load admin routes:', err.message);
}

try {
  const videoCallRoutes = require('./routes/videoCallRoutes');
  app.use('/api/video-call', videoCallRoutes);
  console.log('✅ Loaded route: /api/video-call');
} catch (err) {
  console.log('⚠️ Failed to load video call routes:', err.message);
}

try {
  const notificationRoutes = require('./routes/notificationRoutes');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Loaded route: /api/notifications');
} catch (err) {
  console.log('⚠️ Failed to load notification routes:', err.message);
}

try {
  const emailRoutes = require('./routes/emailRoutes');
  app.use('/api/email', emailRoutes);
  console.log('✅ Loaded route: /api/email');
} catch (err) {
  console.log('⚠️ Failed to load email routes:', err.message);
}

try {
  const paymentRoutes = require('./routes/paymentRoutes');
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Loaded route: /api/payments');
} catch (err) {
  console.log('⚠️ Failed to load payment routes:', err.message);
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route to verify routing is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Routes are working!', timestamp: new Date().toISOString() });
});

// Test auth route
app.post('/api/test/auth', (req, res) => {
  res.json({ message: 'Auth route test successful', body: req.body });
});

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

global.io = io;

// Store user socket mappings with better tracking
const userSockets = new Map(); // userId -> Set of socketIds
const socketUsers = new Map(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'undefined' && userId !== 'null') {
    // Track this socket for the user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socketUsers.set(socket.id, userId);
    socket.userId = userId;
    
    console.log(`User ${userId} connected with socket ${socket.id}`);
    console.log(`User ${userId} now has ${userSockets.get(userId).size} active connections`);
    
    // Join user to their personal notification room
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  } else {
    console.log('Socket connected without valid userId:', userId);
  }

  socket.on('joinNotifications', (userId) => {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log(`User ${userId} explicitly joined notifications room`);
      socket.join(userId);
      
      // Update tracking
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socketUsers.set(socket.id, userId);
      socket.userId = userId;
      
      console.log(`Total users tracked: ${userSockets.size}`);
      console.log(`User ${userId} connections: ${userSockets.get(userId).size}`);
    }
  });

  // Debug listener to help with troubleshooting
  socket.on('debug-ping', (data) => {
    console.log(`Debug ping from user ${data.userId}:`, data);
    const roomSize = io.adapter.rooms ? (io.adapter.rooms.get(data.userId)?.size || 0) : 0;
    socket.emit('debug-pong', { 
      message: 'Server received ping', 
      socketId: socket.id,
      userId: socket.userId,
      roomSize: roomSize,
      totalConnections: io.sockets.sockets.size,
      userConnections: userSockets.get(data.userId)?.size || 0
    });
  });

  // Handle call acceptance (for notifications)
  socket.on('accept-call', ({ roomId }) => {
    console.log(`Call accepted for Jitsi room: ${roomId} by user ${socket.userId}`);
    socket.to(roomId).emit('call-accepted', { roomId });
  });

  // Handle call decline (for notifications)
  socket.on('decline-call', ({ roomId }) => {
    console.log(`Call declined for Jitsi room: ${roomId} by user ${socket.userId}`);
    socket.to(roomId).emit('call-declined', { roomId });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    const userId = socketUsers.get(socket.id);
    if (userId) {
      // Remove this socket from user tracking
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          console.log(`User ${userId} has no more active connections`);
        } else {
          console.log(`User ${userId} still has ${userSocketSet.size} active connections`);
        }
      }
      socketUsers.delete(socket.id);
    }
    
    console.log(`Total active connections: ${io.sockets.sockets.size}`);
    console.log(`Total users with connections: ${userSockets.size}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${corsOptions.origin}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
