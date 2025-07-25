const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  testCredentials,
  testSessionCreation,
  testWaliNotification,
  getSystemHealth
} = require('../controllers/videoCallTestController');

// @route   GET /api/zoom/test-credentials
// @desc    Test Zoom credentials and configuration
// @access  Private
router.get('/test-credentials', protect, testCredentials);

// @route   POST /api/zoom/test-session
// @desc    Test video session creation (without actually creating a meeting)
// @access  Private
router.post('/test-session', protect, testSessionCreation);

// @route   POST /api/zoom/test-wali-notification
// @desc    Test Wali notification system
// @access  Private
router.post('/test-wali-notification', protect, testWaliNotification);

// @route   GET /api/zoom/system-health
// @desc    Get video call system health status
// @access  Private
router.get('/system-health', protect, getSystemHealth);

module.exports = router;
