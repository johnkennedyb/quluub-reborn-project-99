const express = require('express');
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

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: ['https://preview--quluub-reborn-project-99.lovable.app', 'http://localhost:8080', 'http://localhost:8080', process.env.FRONTEND_URL].filter(Boolean),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
