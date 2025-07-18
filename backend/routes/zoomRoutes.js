const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, deleteMeeting } = require('../controllers/zoomController');
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

module.exports = router;
