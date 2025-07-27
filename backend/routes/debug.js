const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @desc    Debug user summaries - check if users have summaries set
// @route   GET /api/debug/user-summaries
// @access  Private
router.get('/user-summaries', auth, async (req, res) => {
  try {
    // Get current user's summary
    const currentUser = await User.findById(req.user._id).select('fname lname username summary');
    
    // Get a sample of users with summaries
    const usersWithSummaries = await User.find({ 
      summary: { $exists: true, $ne: '', $ne: null } 
    }).select('fname lname username summary').limit(5);
    
    // Get a sample of users without summaries
    const usersWithoutSummaries = await User.find({ 
      $or: [
        { summary: { $exists: false } },
        { summary: '' },
        { summary: null }
      ]
    }).select('fname lname username summary').limit(5);
    
    // Count totals
    const totalUsers = await User.countDocuments();
    const usersWithSummaryCount = await User.countDocuments({ 
      summary: { $exists: true, $ne: '', $ne: null } 
    });
    const usersWithoutSummaryCount = totalUsers - usersWithSummaryCount;
    
    res.json({
      currentUser: {
        name: `${currentUser.fname} ${currentUser.lname}`,
        username: currentUser.username,
        summary: currentUser.summary || 'NO SUMMARY SET',
        hasSummary: !!currentUser.summary
      },
      statistics: {
        totalUsers,
        usersWithSummary: usersWithSummaryCount,
        usersWithoutSummary: usersWithoutSummaryCount,
        percentageWithSummary: ((usersWithSummaryCount / totalUsers) * 100).toFixed(1)
      },
      sampleUsersWithSummaries: usersWithSummaries.map(user => ({
        name: `${user.fname} ${user.lname}`,
        username: user.username,
        summary: user.summary?.substring(0, 100) + (user.summary?.length > 100 ? '...' : '')
      })),
      sampleUsersWithoutSummaries: usersWithoutSummaries.map(user => ({
        name: `${user.fname} ${user.lname}`,
        username: user.username,
        summary: 'NO SUMMARY SET'
      }))
    });
  } catch (error) {
    console.error('Debug user summaries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
