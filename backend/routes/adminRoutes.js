
const express = require('express');
const {
  getStats,
  getAllUsers,
  getUserDetails,
  updateUserAccountStatus,
  updateUserPlan,
  updateUser,
  deleteUser,
  sendPasswordResetLink,
  verifyUserEmail,
  getSystemMetrics,
  getAllCalls,
  saveCallRecord,
  uploadCallRecording,
  sendBulkEmail,
  scheduleEmail,
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
  sendMatchSuggestions,
  getScheduledEmails,
  cancelScheduledEmail,
  sendAdminPushNotification,
  getAdminPushNotifications,
  getPaymentHistory,
  processRefund,
  sendIndividualEmail
} = require('../controllers/adminController');
const {
  getAllSubscriptions
} = require('../controllers/subscriptionController');
const { createSampleReports } = require('../utils/createSampleReports');

const { protect, isAdmin } = require('../middlewares/auth');
const cache = require('../middlewares/cache');
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

// Multer config for email attachments
const emailAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

// All admin routes require authentication and admin privileges
router.post('/bulk-email', protect, isAdmin, emailAttachmentUpload.array('attachments', 5), sendBulkEmail);
router.post('/schedule-email', protect, isAdmin, emailAttachmentUpload.array('attachments', 5), scheduleEmail);
router.post('/send-individual-email', protect, isAdmin, sendIndividualEmail);
router.use(protect, isAdmin);

// Admin dashboard routes
router.get('/stats', cache(3600), getStats); // Cache for 1 hour
router.get('/users', getAllUsers);
router.route('/users/:id').get(getUserDetails).put(updateUser).delete(deleteUser);
router.get('/users/:id/potential-matches', getPotentialMatches);

// User management routes
router.patch('/users/:id/status', updateUserAccountStatus);
router.put('/users/:id/plan', updateUserPlan);
router.post('/users/:id/reset-password', sendPasswordResetLink);
router.post('/users/:id/verify-email', verifyUserEmail);
router.post('/users/:id/suggest-matches', sendMatchSuggestions);

// System routes
router.get('/system', getSystemMetrics);

// Call management routes
router.get('/calls', getAllCalls);
router.post('/calls', saveCallRecord);
router.post('/call-recordings', upload.single('recording'), uploadCallRecording);

// Chat management routes
router.get('/chat-reports', getChatReports);
router.post('/send-chat-report', sendChatReport);

// Email management routes
router.post('/test-email', sendTestEmail);
router.get('/email-metrics', getEmailMetrics);
router.post('/email-config', saveEmailConfig);
router.get('/email-config', getEmailConfig);
router.get('/scheduled-emails', getScheduledEmails);
router.delete('/scheduled-emails/:id', cancelScheduledEmail);

// Push Notification routes
router.route('/push-notifications').get(getAdminPushNotifications).post(sendAdminPushNotification);

// Reported profiles routes
router.get('/reported-profiles', getReportedProfiles);
router.patch('/reported-profiles/:id/dismiss', dismissReport);

// Create sample reports for testing (remove in production)
router.post('/create-sample-reports', async (req, res) => {
  try {
    await createSampleReports();
    res.json({ message: 'Sample reports created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sample reports' });
  }
});

// Analytics routes
router.get('/matching-insights', getMatchingInsights);
router.get('/engagement-metrics', getEngagementMetrics);
router.get('/conversion-metrics', getConversionMetrics);
router.get('/churn-analysis', getChurnAnalysis);
router.get('/referral-analysis', getReferralAnalysis);

// Premium users route (renamed from VIP)
router.get('/premium-users', getVipUsers);

// Subscription and Payment routes
router.get('/subscriptions', getAllSubscriptions);
router.get('/payments', getPaymentHistory);
router.post('/payments/:id/refund', processRefund);

module.exports = router;
