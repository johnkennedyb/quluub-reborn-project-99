const express = require('express');
const router = express.Router();
const { createMeeting, createUIToolkitSession, joinSession, sendCallInvitation } = require('../controllers/zoomController');
const { protect } = require('../middlewares/authMiddleware');

// All Zoom routes require authentication
router.use(protect);

// @route   POST /api/zoom/create-meeting
// @desc    Create a new Zoom meeting
// @access  Private (Premium users only)
router.post('/create-meeting', createMeeting);

// @route   POST /api/zoom/session
// @desc    Create a UI Toolkit session
// @access  Private (Premium users only)
router.post('/session', createUIToolkitSession);

// @route   POST /api/zoom/join-session
// @desc    Join an existing Zoom session
// @access  Private (Premium users only)
router.post('/join-session', joinSession);

// @route   POST /api/zoom/send-invitation
// @desc    Send video call invitation to match
// @access  Private (Premium users only)
router.post('/send-invitation', sendCallInvitation);

module.exports = router;
