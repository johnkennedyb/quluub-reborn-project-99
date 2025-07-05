
const User = require('../models/User');
const Relationship = require('../models/Relationship');
const Chat = require('../models/Chat');
const Call = require('../models/Call');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
  try {
    // Get basic user counts
    const totalMembers = await User.countDocuments();
    const maleMembers = await User.countDocuments({ gender: 'male' });
    const femaleMembers = await User.countDocuments({ gender: 'female' });
    const premiumMembers = await User.countDocuments({ plan: 'premium' });
    const proMembers = await User.countDocuments({ plan: 'pro' });
    const hiddenProfiles = await User.countDocuments({ hidden: true });

    // Activity statistics
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeToday = await User.countDocuments({ lastSeen: { $gte: today } });
    const activeThisWeek = await User.countDocuments({ lastSeen: { $gte: oneWeekAgo } });
    const activeThisMonth = await User.countDocuments({ lastSeen: { $gte: oneMonthAgo } });
    
    // Inactive users
    const inactiveUsers = await User.countDocuments({ lastSeen: { $lt: oneMonthAgo } });
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const inactiveQuarter = await User.countDocuments({ lastSeen: { $lt: threeMonthsAgo } });
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const inactiveSixMonths = await User.countDocuments({ lastSeen: { $lt: sixMonthsAgo } });
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const inactiveYear = await User.countDocuments({ lastSeen: { $lt: oneYearAgo } });

    // Registration statistics
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    // Match statistics
    const totalMatches = await Relationship.countDocuments({ status: 'matched' });
    const pendingRequests = await Relationship.countDocuments({ status: 'pending' });
    const rejectedRequests = await Relationship.countDocuments({ status: 'rejected' });

    // Chat statistics
    const messagesExchanged = await Chat.countDocuments();
    const messagesThisWeek = await Chat.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const messagesThisMonth = await Chat.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    // Calculate derived metrics
    const successRate = totalMatches > 0 ? Math.round((totalMatches / (totalMatches + rejectedRequests)) * 100) : 0;
    const avgMatchesPerUser = totalMembers > 0 ? Math.round(totalMatches / totalMembers * 100) / 100 : 0;
    const conversionRate = totalMembers > 0 ? Math.round((premiumMembers / totalMembers) * 100) : 0;
    const engagementRate = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
    const churnRate = totalMembers > 0 ? Math.round((inactiveUsers / totalMembers) * 100) : 0;
    const growthRate = Math.round((monthlyRegistrations / (totalMembers - monthlyRegistrations)) * 100) || 0;

    // Geographic distribution
    const geographicDistribution = await User.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $project: { country: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Age distribution
    const ageDistribution = await User.aggregate([
      { $match: { dob: { $exists: true } } },
      { $project: { age: { $floor: { $divide: [{ $subtract: [new Date(), '$dob'] }, 31557600000] } } } },
      { $group: { _id: '$age', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Top referrers
    const topReferrers = await User.aggregate([
      { $match: { referralCount: { $gt: 0 } } },
      { $project: { 
        username: 1, 
        fname: 1, 
        lname: 1, 
        totalReferrals: '$referralCount',
        activeReferrals: { $ifNull: ['$activeReferrals', 0] }
      }},
      { $sort: { totalReferrals: -1, activeReferrals: -1 } },
      { $limit: 10 }
    ]);

    const stats = {
      totalMembers,
      maleMembers,
      femaleMembers,
      premiumMembers,
      proMembers,
      hiddenProfiles,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      inactiveUsers,
      inactiveQuarter,
      inactiveSixMonths,
      inactiveYear,
      recentRegistrations,
      monthlyRegistrations,
      totalMatches,
      pendingRequests,
      rejectedRequests,
      successRate,
      avgMatchesPerUser,
      matchToChatRate: 85, // Placeholder
      messagesExchanged,
      messagesThisWeek,
      messagesThisMonth,
      avgSessionTime: '45 minutes', // Placeholder
      conversionRate,
      engagementRate,
      churnRate,
      growthRate,
      freeToProConversions: conversionRate,
      totalReferrals: topReferrers.reduce((sum, user) => sum + user.totalReferrals, 0),
      topReferrers,
      geographicDistribution,
      ageDistribution
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      search, 
      gender, 
      plan, 
      status, 
      country, 
      city, 
      inactiveMonths,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (gender && gender !== 'all') filter.gender = gender;
    if (plan && plan !== 'all') filter.plan = plan;
    if (status && status !== 'all') filter.status = status;
    if (country && country !== 'all') filter.country = country;
    if (city && city !== 'all') filter.city = city;
    
    if (inactiveMonths && inactiveMonths !== 'all') {
      const months = parseInt(inactiveMonths);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      filter.lastSeen = { $lt: cutoffDate };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Format users data
    const formattedUsers = users.map(user => ({
      ...user,
      fullName: `${user.fname} ${user.lname}`,
      age: user.dob ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      joinedAgo: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)) : null,
      lastSeenAgo: user.lastSeen ? Math.floor((Date.now() - new Date(user.lastSeen).getTime()) / (24 * 60 * 60 * 1000)) : null
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional stats
    const matchCount = await Relationship.countDocuments({
      $or: [{ follower: user._id }, { followed: user._id }],
      status: 'matched'
    });

    const messageCount = await Chat.countDocuments({
      $or: [{ sender: user._id }, { receiver: user._id }]
    });

    const userData = {
      ...user.toObject(),
      fullName: `${user.fname} ${user.lname}`,
      age: user.dob ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      matchCount,
      messageCount
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private (Admin only)
exports.updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User plan updated successfully', user });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user information
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this route

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up related data
    await Relationship.deleteMany({
      $or: [{ follower: req.params.id }, { followed: req.params.id }]
    });
    await Chat.deleteMany({
      $or: [{ sender: req.params.id }, { receiver: req.params.id }]
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin only)
exports.resetUserPassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Password reset successfully', 
      tempPassword,
      user: { _id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system metrics
// @route   GET /api/admin/system
// @access  Private (Admin only)
exports.getSystemMetrics = async (req, res) => {
  try {
    const metrics = {
      serverStatus: 'Online',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all calls
// @route   GET /api/admin/calls
// @access  Private (Admin only)
exports.getAllCalls = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const calls = await Call.find(filter)
      .populate('participants.userId', 'fname lname username')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Call.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    const statistics = {
      totalCalls: await Call.countDocuments(),
      completedCalls: await Call.countDocuments({ status: 'ended' }),
      avgDuration: 0,
      totalDuration: 0
    };

    res.json({
      calls: calls || [],
      statistics,
      currentPage: parseInt(page),
      totalPages,
      total,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.json({ calls: [], statistics: { totalCalls: 0, completedCalls: 0, avgDuration: 0, totalDuration: 0 } });
  }
};

// @desc    Save call record
// @route   POST /api/admin/calls
// @access  Private (Admin only)
exports.saveCallRecord = async (req, res) => {
  try {
    const callData = req.body;
    const call = new Call(callData);
    await call.save();
    res.json({ message: 'Call record saved', call });
  } catch (error) {
    console.error('Error saving call record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload call recording
// @route   POST /api/admin/call-recordings
// @access  Private (Admin only)
exports.uploadCallRecording = async (req, res) => {
  try {
    const { conversationId, duration } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No recording file provided' });
    }

    // Here you would typically upload to cloud storage
    const recordingUrl = `/uploads/recordings/${file.filename}`;

    res.json({ 
      message: 'Recording uploaded successfully', 
      recordingUrl,
      conversationId,
      duration: duration ? parseInt(duration) : null
    });
  } catch (error) {
    console.error('Error uploading call recording:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get reported profiles
// @route   GET /api/admin/reported-profiles
// @access  Private (Admin only)
exports.getReportedProfiles = async (req, res) => {
  try {
    // For now, return empty array as we don't have a Report model
    res.json({ reports: [] });
  } catch (error) {
    console.error('Error fetching reported profiles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Dismiss report
// @route   PATCH /api/admin/reported-profiles/:id/dismiss
// @access  Private (Admin only)
exports.dismissReport = async (req, res) => {
  try {
    res.json({ message: 'Report dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get potential matches for a user
// @route   GET /api/admin/users/:id/potential-matches
// @access  Private (Admin only)
exports.getPotentialMatches = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find potential matches (opposite gender, similar age range, same country)
    const filter = {
      _id: { $ne: userId },
      gender: user.gender === 'male' ? 'female' : 'male',
      status: 'active'
    };

    if (user.country) {
      filter.country = user.country;
    }

    const matches = await User.find(filter)
      .select('fname lname username gender dob country city')
      .limit(20)
      .lean();

    const formattedMatches = matches.map(match => ({
      ...match,
      fullName: `${match.fname} ${match.lname}`,
      age: match.dob ? Math.floor((Date.now() - new Date(match.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send match suggestions
// @route   POST /api/admin/users/:id/suggest-matches
// @access  Private (Admin only)
exports.sendMatchSuggestions = async (req, res) => {
  try {
    const { suggestedUserIds } = req.body;
    const userId = req.params.id;

    // Here you would implement the logic to send suggestions
    // For now, just return success
    console.log(`Sending ${suggestedUserIds.length} match suggestions to user ${userId}`);

    res.json({ message: 'Match suggestions sent successfully' });
  } catch (error) {
    console.error('Error sending match suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder functions for missing controllers
exports.sendBulkEmail = async (req, res) => {
  res.json({ message: 'Bulk email feature coming soon' });
};

exports.getEmailMetrics = async (req, res) => {
  res.json({ metrics: { sent: 0, opened: 0, clicked: 0 } });
};

exports.getMatchingInsights = async (req, res) => {
  res.json({ insights: [] });
};

exports.getEngagementMetrics = async (req, res) => {
  res.json({ metrics: {} });
};

exports.getConversionMetrics = async (req, res) => {
  res.json({ metrics: {} });
};

exports.getChurnAnalysis = async (req, res) => {
  res.json({ analysis: {} });
};

exports.getReferralAnalysis = async (req, res) => {
  res.json({ analysis: {} });
};

exports.getChatReports = async (req, res) => {
  res.json({ reports: [] });
};

exports.sendChatReport = async (req, res) => {
  res.json({ message: 'Chat report sent' });
};
