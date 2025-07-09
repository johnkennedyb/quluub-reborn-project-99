
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

// Import routes with error handling
const routes = [
  { path: '/api/auth', file: './routes/authRoutes' },
  { path: '/api/users', file: './routes/userRoutes' },
  { path: '/api/relationships', file: './routes/relationshipRoutes' },
  { path: '/api/chats', file: './routes/chatRoutes' },
  { path: '/api/referrals', file: './routes/referralRoutes' },
  { path: '/api/admin', file: './routes/adminRoutes' },
  { path: '/api/video-call', file: './routes/videoCallRoutes' },
  { path: '/api/notifications', file: './routes/notificationRoutes' },
  { path: '/api/email', file: './routes/emailRoutes' },
  { path: '/api/payments', file: './routes/paymentRoutes' }
];

routes.forEach(({ path, file }) => {
  try {
    const route = require(file);
    app.use(path, route);
    console.log(`✅ Loaded route: ${path}`);
  } catch (err) {
    console.log(`⚠️ Failed to load route ${path}:`, err.message);
    // Create a fallback route
    app.use(path, (req, res) => {
      res.status(501).json({ 
        message: `${path} endpoint not implemented yet`,
        status: 'coming_soon'
      });
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
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
