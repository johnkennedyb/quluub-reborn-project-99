
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
  getEmailMetrics,
  getMatchingInsights,
  getEngagementMetrics,
  getConversionMetrics,
  getChurnAnalysis,
  getReferralAnalysis,
  getChatReports,
  sendChatReport
} = require('../controllers/adminController');
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

// User management routes
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/plan', updateUserPlan);
router.put('/users/:id', updateUser);
router.put('/users/:id/reset-password', resetUserPassword);
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

// Email and analytics routes (placeholders)
router.post('/bulk-email', sendBulkEmail);
router.get('/email-metrics', getEmailMetrics);
router.get('/matching-insights', getMatchingInsights);
router.get('/engagement-metrics', getEngagementMetrics);
router.get('/conversion-metrics', getConversionMetrics);
router.get('/churn-analysis', getChurnAnalysis);
router.get('/referral-analysis', getReferralAnalysis);

module.exports = router;
