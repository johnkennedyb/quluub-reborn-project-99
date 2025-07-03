
const express = require('express');
const { 
  getConversations, 
  getMessages, 
  sendMessage, 
  getUnreadCount,
  getChat,
  addChat,
  updateChat,
  getAllChatReceived
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// New routes
router.get('/conversations', protect, getConversations);
router.get('/messages/:userId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.get('/unread', protect, getUnreadCount);

// Legacy routes for compatibility
router.get('/chat', protect, getChat);
router.post('/chat', protect, addChat);
router.put('/chat', protect, updateChat);
router.get('/chat/received', protect, getAllChatReceived);

module.exports = router;
