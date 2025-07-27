const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, deleteMeeting, generateSignature, notifyWali, getSDKToken } = require('../controllers/zoomController');
const { protect } = require('../middlewares/authMiddleware');

// All Zoom routes require authentication
router.use(protect);

// @route   POST /api/zoom/create-meeting
// @desc    Create a new Zoom meeting
// @access  Private (Premium users only)
router.post('/create-meeting', createMeeting);

// @route   GET /api/zoom/meeting/:meetingId
// @desc    Get meeting details
// @access  Private (Premium users only)
router.get('/meeting/:meetingId', getMeeting);

// @route   DELETE /api/zoom/meeting/:meetingId
// @desc    Delete a meeting
// @access  Private (Premium users only)
router.delete('/meeting/:meetingId', deleteMeeting);

// @route   POST /api/zoom/get-sdk-token
// @desc    Generate Video SDK JWT for frontend
// @access  Private (Premium users only)
router.post('/get-sdk-token', getSDKToken);

// @route   POST /api/zoom/signature
// @desc    Generate Zoom SDK signature
// @access  Private (Premium users only)
router.post('/signature', generateSignature);

// @route   POST /api/zoom/notify-wali
// @desc    Notify Wali about video call
// @access  Private (Premium users only)
router.post('/notify-wali', notifyWali);

module.exports = router;
