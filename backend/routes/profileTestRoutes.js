const express = require('express');
const { 
  testProfileIntegrity,
  validateProfileSchema,
  testProfileSave,
  getCompleteProfile,
  resetProfileForTesting
} = require('../controllers/profileTestController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Profile data integrity testing routes
router.post('/profile-integrity', protect, testProfileIntegrity);
router.get('/profile-schema', protect, validateProfileSchema);
router.post('/profile-save', protect, testProfileSave);
router.get('/profile-complete', protect, getCompleteProfile);
router.post('/profile-reset', protect, resetProfileForTesting);

module.exports = router;
