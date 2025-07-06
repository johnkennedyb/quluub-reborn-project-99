const express = require('express');
const {
  getStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserPlan,
  updateUser,
  deleteUser,
  resetUserPassword,
  getSystemMetrics,
  getAllCalls,
  saveCallRecord,
  uploadCallRecording,
  sendBulkEmail,
  sendTestEmail,
  getEmailMetrics,
  saveEmailConfig,
  getEmailConfig,
  getMatchingInsights,
  getEngagementMetrics,
  getConversionMetrics,
  getChurnAnalysis,
  getReferralAnalysis,
  getChatReports,
  sendChatReport,
  getReportedProfiles,
  dismissReport,
  getVipUsers,
  getPotentialMatches,
  sendMatchSuggestions
} = require('../controllers/adminController');
const {
  getAllSubscriptions
} = require('../controllers/subscriptionController');
const {
  getAllPayments,
  processRefund
} = require('../controllers/paymentController');
const { adminAuth } = require('../middlewares/adminAuth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/recordings/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /webm|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// All admin routes require authentication
router.use(adminAuth);

// Admin dashboard routes
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/potential-matches', getPotentialMatches);

// User management routes
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/plan', updateUserPlan);
router.put('/users/:id', updateUser);
router.put('/users/:id/reset-password', resetUserPassword);
router.post('/users/:id/suggest-matches', sendMatchSuggestions);
router.delete('/users/:id', deleteUser);

// System routes
router.get('/system', getSystemMetrics);

// Call management routes
router.get('/calls', getAllCalls);
router.post('/calls', saveCallRecord);
router.post('/call-recordings', upload.single('recording'), uploadCallRecording);

// Chat management routes
router.get('/chat-reports', getChatReports);
router.post('/send-chat-report', sendChatReport);

// Reported profiles routes
router.get('/reported-profiles', getReportedProfiles);
router.patch('/reported-profiles/:id/dismiss', dismissReport);

// Email configuration and management routes
router.get('/email-config', getEmailConfig);
router.post('/email-config', saveEmailConfig);
router.post('/bulk-email', sendBulkEmail);
router.post('/test-email', sendTestEmail);
router.get('/email-metrics', getEmailMetrics);

// Analytics routes
router.get('/matching-insights', getMatchingInsights);
router.get('/engagement-metrics', getEngagementMetrics);
router.get('/conversion-metrics', getConversionMetrics);
router.get('/churn-analysis', getChurnAnalysis);
router.get('/referral-analysis', getReferralAnalysis);

// VIP users route
router.get('/vip-users', getVipUsers);

// Subscription and Payment routes
router.get('/subscriptions', getAllSubscriptions);
router.get('/payments', getAllPayments);
router.post('/payments/:id/refund', processRefund);

module.exports = router;
