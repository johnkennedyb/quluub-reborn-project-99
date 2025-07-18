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
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const referralRoutes = require('./routes/referralRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const userRoutes = require('./routes/userRoutes');
const videoCallRoutes = require('./routes/videoCallRoutes');
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

let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);
    let userIdToUpdate;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        userIdToUpdate = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (userIdToUpdate) {
      try {
        await User.findByIdAndUpdate(userIdToUpdate, { lastSeen: new Date() });
        console.log(`Updated lastSeen for user ${userIdToUpdate}`);
      } catch (error) {
        console.error('Failed to update lastSeen on disconnect:', error);
      }
    }

    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/video-call', videoCallRoutes);
app.use('/api/zoom', require('./routes/zoomRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
