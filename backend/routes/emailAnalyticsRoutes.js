
const express = require('express');
const {
  trackEmailOpen,
  trackEmailClick,
  handleEmailBounce,
  getEmailAnalytics
} = require('../controllers/emailAnalyticsController');
const { protect } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');

const router = express.Router();

// Public tracking routes (no auth required)
router.get('/track/open/:messageId', trackEmailOpen);
router.post('/track/click/:messageId', trackEmailClick);
router.post('/webhook/bounce', handleEmailBounce);

// Protected admin routes
router.get('/analytics', protect, adminAuth, getEmailAnalytics);

module.exports = router;
