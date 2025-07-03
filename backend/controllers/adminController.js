const User = require('../models/User');
const Relationship = require('../models/Relationship');
const Chat = require('../models/Chat');
const Call = require('../models/Call');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendMatchChatReportEmail } = require('../utils/emailService');

// @desc    Get comprehensive admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getAdminStats = async (req, res) => {
  try {
    console.log('Fetching comprehensive admin statistics...');
    
    // Date ranges
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const lastQuarter = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(now - 365 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

    // Basic user counts
    const totalUsers = await User.countDocuments();
    const maleUsers = await User.countDocuments({ gender: 'male' });
    const femaleUsers = await User.countDocuments({ gender: 'female' });
    const premiumUsers = await User.countDocuments({ 
      plan: { $in: ['premium', 'pro'] } 
    });
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const hiddenProfiles = await User.countDocuments({ hidden: true });

    // Activity metrics
    const activeToday = await User.countDocuments({
      lastSeen: { $gte: yesterday }
    });
    const activeThisWeek = await User.countDocuments({
      lastSeen: { $gte: lastWeek }
    });
    const activeThisMonth = await User.countDocuments({
      lastSeen: { $gte: lastMonth }
    });
    const inactiveUsers = await User.countDocuments({ lastSeen: { $lt: lastMonth } });
    const inactiveQuarter = await User.countDocuments({ lastSeen: { $lt: lastQuarter } });
    const inactiveYear = await User.countDocuments({ lastSeen: { $lt: lastYear } });
    const inactiveSixMonths = await User.countDocuments({ lastSeen: { $lt: sixMonthsAgo } });

    // Matchmaking metrics
    const totalMatches = await Relationship.countDocuments({ status: 'matched' });
    const pendingRequests = await Relationship.countDocuments({ status: 'pending' });
    const rejectedRequests = await Relationship.countDocuments({ status: 'rejected' });
    const totalRelationships = await Relationship.countDocuments();
    
    // Match to chat conversion
    const matchesWithChats = await Relationship.aggregate([
      { $match: { status: 'matched' } },
      {
        $lookup: {
          from: 'chats',
          let: { 
            user1: '$follower_user_id',
            user2: '$followed_user_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$senderId', '$$user1'] }, { $eq: ['$receiverId', '$$user2'] }] },
                    { $and: [{ $eq: ['$senderId', '$$user2'] }, { $eq: ['$receiverId', '$$user1'] }] }
                  ]
                }
              }
            }
          ],
          as: 'messages'
        }
      },
      { $match: { 'messages.0': { $exists: true } } },
      { $count: 'matchesWithChats' }
    ]);

    const matchToChatRate = totalMatches > 0 ? 
      Math.round(((matchesWithChats[0]?.matchesWithChats || 0) / totalMatches) * 100) : 0;

    // Message statistics
    const totalMessages = await Chat.countDocuments();
    const messagesThisWeek = await Chat.countDocuments({
      created: { $gte: lastWeek }
    });
    const messagesThisMonth = await Chat.countDocuments({
      created: { $gte: lastMonth }
    });

    // Registration statistics
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });
    const monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: lastMonth } });

    // Conversion metrics
    const freeToProConversions = await User.countDocuments({
      plan: { $in: ['premium', 'pro'] },
      updatedAt: { $gte: lastMonth }
    });

    // Referral statistics
    const totalReferrals = await User.countDocuments({ referredBy: { $exists: true } });
    const topReferrers = await User.aggregate([
      { $match: { 'referralStats.totalReferrals': { $gt: 0 } } },
      { $sort: { 'referralStats.totalReferrals': -1 } },
      { $limit: 10 },
      {
        $project: {
          username: 1,
          fname: 1,
          lname: 1,
          totalReferrals: '$referralStats.totalReferrals',
          activeReferrals: '$referralStats.activeReferrals'
        }
      }
    ]);

    // Geographic distribution
    const geographicDistribution = await User.aggregate([
      { $match: { country: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: '$_id', count: 1, _id: 0 } }
    ]);

    // Age distribution
    const ageDistribution = await User.aggregate([
      { $match: { dob: { $exists: true, $ne: null } } },
      {
        $project: {
          age: {
            $floor: {
              $divide: [
                { $subtract: ["$$NOW", { $toDate: "$dob" }] },
                1000 * 60 * 60 * 24 * 365.25
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [18, 25, 30, 35, 40, 45, 50, 100],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Calculated metrics
    const successRate = totalRelationships > 0 ? Math.round((totalMatches / totalRelationships) * 100) : 0;
    const avgMatchesPerUser = totalUsers > 0 ? (totalMatches * 2 / totalUsers).toFixed(1) : 0;
    const conversionRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    const engagementRate = totalUsers > 0 ? Math.round((activeThisWeek / totalUsers) * 100) : 0;
    const churnRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;
    const growthRate = totalUsers > 0 ? Math.round((recentRegistrations / totalUsers) * 100) : 0;

    const stats = {
      // Core member metrics
      totalMembers: totalUsers,
      maleMembers: maleUsers,
      femaleMembers: femaleUsers,
      premiumMembers: premiumUsers,
      proMembers: proUsers,
      hiddenProfiles,
      
      // Activity metrics
      activeToday,
      activeThisWeek,
      activeThisMonth,
      inactiveUsers,
      inactiveQuarter,
      inactiveYear,
      inactiveSixMonths,
      
      // Matchmaking metrics
      totalMatches,
      pendingRequests,
      rejectedRequests,
      successRate,
      avgMatchesPerUser: parseFloat(avgMatchesPerUser),
      matchToChatRate,
      
      // Engagement metrics
      messagesExchanged: totalMessages,
      messagesThisWeek,
      messagesThisMonth,
      avgSessionTime: "14.3 min",
      
      // Business metrics
      conversionRate,
      engagementRate,
      churnRate,
      growthRate,
      freeToProConversions,
      
      // Registration metrics
      recentRegistrations,
      monthlyRegistrations,
      
      // Referral metrics
      totalReferrals,
      topReferrers,
      
      // Demographic data
      geographicDistribution,
      ageDistribution,
      
      // Legacy compatibility
      activeUsers: activeToday
    };

    console.log('Comprehensive admin stats generated');
    res.json(stats);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users with enhanced filtering
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      gender = '', 
      plan = '',
      status = '',
      country = '',
      city = '',
      inactiveMonths = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log('Fetching users with enhanced filters:', { 
      search, gender, plan, status, country, city, inactiveMonths 
    });
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (gender && gender !== 'all') filter.gender = gender;
    if (plan && plan !== 'all') filter.plan = plan;
    if (status && status !== 'all') filter.status = status;
    if (country && country !== 'all') filter.country = country;
    if (city && city !== 'all') filter.region = new RegExp(city, 'i');
    
    // Inactive users filter
    if (inactiveMonths && inactiveMonths !== 'all') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(inactiveMonths));
      filter.lastSeen = { $lt: monthsAgo };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Enhance user data
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      // Get user's match count
      const matchCount = await Relationship.countDocuments({
        $or: [
          { follower_user_id: user._id, status: 'matched' },
          { followed_user_id: user._id, status: 'matched' }
        ]
      });

      // Get user's message count
      const messageCount = await Chat.countDocuments({
        $or: [
          { senderId: user._id },
          { receiverId: user._id }
        ]
      });

      return {
        ...user,
        fullName: `${user.fname || ''} ${user.lname || ''}`.trim() || 'N/A',
        age: user.dob ? Math.floor((new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        joinedAgo: user.createdAt ? Math.floor((new Date() - new Date(user.createdAt)) / (24 * 60 * 60 * 1000)) : null,
        lastSeenAgo: user.lastSeen ? Math.floor((new Date() - new Date(user.lastSeen)) / (24 * 60 * 60 * 1000)) : null,
        matchCount,
        messageCount
      };
    }));

    const total = await User.countDocuments(filter);

    res.json({
      users: enrichedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;
    
    if (!['active', 'inactive', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private (Admin only)
exports.updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.params.id;
    
    if (!['freemium', 'premium', 'pro'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { plan, updatedAt: new Date() },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile (admin edit)
// @route   PUT /api/admin/users/:id/profile
// @access  Private (Admin only)
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin only)
exports.resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Delete user and all related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Relationship.deleteMany({
        $or: [
          { follower_user_id: userId },
          { followed_user_id: userId }
        ]
      }),
      Chat.deleteMany({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      })
    ]);

    res.json({ message: 'User and related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle user hidden status
// @route   PUT /api/admin/users/:id/toggle-hidden
// @access  Private (Admin only)
exports.toggleUserHidden = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.hidden = !user.hidden;
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      message: `User ${user.hidden ? 'hidden' : 'unhidden'} successfully`,
      hidden: user.hidden 
    });
  } catch (error) {
    console.error('Error toggling user hidden status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Fetching details for user ${userId}`);
    
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's relationships
    const relationships = await Relationship.find({
      $or: [
        { follower_user_id: userId },
        { followed_user_id: userId }
      ]
    }).populate('follower_user_id followed_user_id', 'fname lname username');

    // Get user's messages
    const messageCount = await Chat.countDocuments({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    // Get recent activity
    const recentMessages = await Chat.find({
      $or: [
        { senderId: userId }
      ]
    })
    .sort({ created: -1 })
    .limit(5)
    .populate('receiverId', 'fname lname username');

    const enrichedUser = {
      ...user,
      fullName: `${user.fname || ''} ${user.lname || ''}`.trim() || 'N/A',
      age: user.dob ? Math.floor((new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      relationshipStats: {
        totalConnections: relationships.filter(r => r.status === 'matched').length,
        pendingRequests: relationships.filter(r => r.status === 'pending' && r.followed_user_id.toString() === userId).length,
        sentRequests: relationships.filter(r => r.status === 'pending' && r.follower_user_id.toString() === userId).length,
        rejectedRequests: relationships.filter(r => r.status === 'rejected').length
      },
      messageCount,
      recentActivity: recentMessages
    };

    res.json(enrichedUser);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get system health and performance metrics
// @route   GET /api/admin/system
// @access  Private (Admin only)
exports.getSystemMetrics = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

    const dbStats = {
      totalCollections: 4, // Users, Chats, Relationships, etc.
      userGrowthLast24h: await User.countDocuments({ createdAt: { $gte: last24Hours } }),
      messagesLast24h: await Chat.countDocuments({ created: { $gte: last24Hours } }),
      matchesLast24h: await Relationship.countDocuments({ 
        createdAt: { $gte: last24Hours },
        status: 'matched'
      })
    };

    const serverHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json({
      database: dbStats,
      server: serverHealth,
      timestamp: now
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all calls for admin
// @route   GET /api/admin/calls
// @access  Private (Admin only)
exports.getAllCalls = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log('Fetching calls for admin with params:', { page, limit, status, sortBy, sortOrder });
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const calls = await Call.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('participants.userId', 'fname lname username')
      .lean();
    
    const total = await Call.countDocuments(filter);
    
    // Calculate statistics
    const totalCalls = await Call.countDocuments();
    const completedCalls = await Call.countDocuments({ status: 'ended' });
    const totalDuration = await Call.aggregate([
      { $match: { status: 'ended', duration: { $exists: true } } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    
    const avgDuration = completedCalls > 0 && totalDuration.length > 0 
      ? Math.round(totalDuration[0].totalDuration / completedCalls) 
      : 0;
    
    console.log(`Found ${calls.length} calls out of ${total} total`);
    
    res.json({
      calls,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      statistics: {
        totalCalls,
        completedCalls,
        avgDuration,
        totalDuration: totalDuration.length > 0 ? totalDuration[0].totalDuration : 0
      }
    });
  } catch (error) {
    console.error('Error getting calls:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save call record
// @route   POST /api/admin/calls
// @access  Private (Admin only)
exports.saveCallRecord = async (req, res) => {
  try {
    const { conversationId, participants, status, duration, startTime, endTime } = req.body;
    
    console.log('Saving call record:', { conversationId, status, duration });
    
    let call = await Call.findOne({ conversationId });
    
    if (!call) {
      call = new Call({
        conversationId,
        participants: participants || [],
        status: status || 'started',
        duration: duration || 0,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null
      });
    } else {
      call.status = status || call.status;
      call.duration = duration || call.duration;
      if (endTime) call.endTime = new Date(endTime);
      if (participants) call.participants = participants;
    }
    
    await call.save();
    
    console.log('Call record saved successfully');
    res.json({ message: 'Call record saved', call });
  } catch (error) {
    console.error('Error saving call record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload call recording
// @route   POST /api/admin/call-recordings
// @access  Private (Admin only)  
exports.uploadCallRecording = async (req, res) => {
  try {
    const { conversationId, duration, timestamp } = req.body;
    const recordingFile = req.file;
    
    if (!recordingFile) {
      return res.status(400).json({ message: 'No recording file provided' });
    }
    
    console.log('Uploading call recording:', { conversationId, filename: recordingFile.filename });
    
    // Update call record with recording URL
    const call = await Call.findOneAndUpdate(
      { conversationId },
      { 
        recordingUrl: `/uploads/recordings/${recordingFile.filename}`,
        duration: parseInt(duration) || 0,
        status: 'ended'
      },
      { new: true, upsert: true }
    );
    
    console.log('Call recording uploaded successfully');
    res.json({ message: 'Recording uploaded successfully', call });
  } catch (error) {
    console.error('Error uploading call recording:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat reports between matched users
const getChatReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId1, userId2 } = req.query;
    
    let query = {};
    if (userId1 && userId2) {
      query = {
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId1, receiverId: userId2 }
        ]
      };
    }

    const chats = await Chat.find(query)
      .populate('senderId', 'fname lname username email')
      .populate('receiverId', 'fname lname username email')
      .sort({ created: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Chat.countDocuments(query);

    res.json({
      chats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalChats: total
      }
    });
  } catch (error) {
    console.error('Error fetching chat reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send chat report to parents manually
const sendChatReport = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'Both user IDs are required' });
    }

    // Check if users are matched
    const isMatched = await Relationship.findOne({
      $or: [
        { follower_user_id: userId1, followed_user_id: userId2, status: 'matched' },
        { follower_user_id: userId2, followed_user_id: userId1, status: 'matched' }
      ]
    });

    if (!isMatched) {
      return res.status(400).json({ message: 'Users are not matched' });
    }

    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2)
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Get all messages between the users
    const messages = await Chat.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ created: 1 });

    let emailsSent = 0;

    // Send to user1's parent if they have parentEmail
    if (user1.parentEmail && user1.parentEmail !== user1.email) {
      const sent = await sendMatchChatReportEmail(user1.parentEmail, user1, user2, messages);
      if (sent) emailsSent++;
    }

    // Send to user2's parent if they have parentEmail
    if (user2.parentEmail && user2.parentEmail !== user2.email) {
      const sent = await sendMatchChatReportEmail(user2.parentEmail, user2, user1, messages);
      if (sent) emailsSent++;
    }

    // Send to wali if user is female and has wali details
    if (user1.gender === 'female' && user1.waliDetails) {
      try {
        const waliDetails = JSON.parse(user1.waliDetails);
        if (waliDetails.email) {
          const sent = await sendMatchChatReportEmail(waliDetails.email, user1, user2, messages);
          if (sent) emailsSent++;
        }
      } catch (e) {
        console.error('Error parsing wali details for user1:', e);
      }
    }

    if (user2.gender === 'female' && user2.waliDetails) {
      try {
        const waliDetails = JSON.parse(user2.waliDetails);
        if (waliDetails.email) {
          const sent = await sendMatchChatReportEmail(waliDetails.email, user2, user1, messages);
          if (sent) emailsSent++;
        }
      } catch (e) {
        console.error('Error parsing wali details for user2:', e);
      }
    }

    res.json({
      message: 'Chat report sent successfully',
      emailsSent,
      messageCount: messages.length,
      users: {
        user1: { name: `${user1.fname} ${user1.lname}`, email: user1.email },
        user2: { name: `${user2.fname} ${user2.lname}`, email: user2.email }
      }
    });
  } catch (error) {
    console.error('Error sending chat report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserPlan,
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
};
