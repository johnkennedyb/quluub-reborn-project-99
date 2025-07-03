
const express = require('express');
const {
  sendEmailValidation,
  verifyEmail,
  resendEmailValidation,
  getEmailVerificationStatus,
  sendPasswordResetEmail,
  resetPassword
} = require('../controllers/emailController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/send-validation', sendEmailValidation);
router.post('/verify', verifyEmail);
router.post('/forgot-password', sendPasswordResetEmail);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/resend-validation', protect, resendEmailValidation);
router.get('/status', protect, getEmailVerificationStatus);

module.exports = router;
