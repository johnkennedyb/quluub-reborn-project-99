const express = require('express');
const router = express.Router();
const { createRoom, getRoom, deleteRoom } = require('../controllers/wherebyController');
const { protect } = require('../middlewares/authMiddleware');

// All Whereby routes require authentication
router.use(protect);

// @route   POST /api/whereby/create-room
// @desc    Create a new Whereby room
// @access  Private (Premium users only)
router.post('/create-room', createRoom);

// @route   GET /api/whereby/room/:meetingId
// @desc    Get room details
// @access  Private (Premium users only)
router.get('/room/:meetingId', getRoom);

// @route   DELETE /api/whereby/room/:meetingId
// @desc    Delete a room
// @access  Private (Premium users only)
router.delete('/room/:meetingId', deleteRoom);

module.exports = router;
