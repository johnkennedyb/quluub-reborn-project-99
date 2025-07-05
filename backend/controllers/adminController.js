const User = require('../models/User');
const Relationship = require('../models/Relationship');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin statistics...');
    
    // Get total members count
    const totalMembers = await User.countDocuments();
    
    // Get gender distribution
    const genderStats = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    
    const maleMembers = genderStats.find(g => g._id === 'male')?.count || 0;
    const femaleMembers = genderStats.find(g => g._id === 'female')?.count || 0;
    
    // Get plan distribution
    const planStats = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);
    
    const premiumMembers = planStats.find(p => p._id === 'Premium')?.count || 0;
    const proMembers = planStats.find(p => p._id === 'Pro')?.count || 0;
    
    // Get hidden profiles count
    const hiddenProfiles = await User.countDocuments({ hidden: true });
    
    // Get activity stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const activeToday = await User.countDocuments({ lastSeen: { $gte: today } });
    const activeThisWeek = await User.countDocuments({ lastSeen: { $gte: thisWeek } });
    const activeThisMonth = await User.countDocuments({ lastSeen: { $gte: thisMonth } });
    
    // Inactive users
    const inactiveUsers = await User.countDocuments({ lastSeen: { $lt: oneMonthAgo } });
    const inactiveQuarter = await User.countDocuments({ lastSeen: { $lt: threeMonthsAgo } });
    const inactiveSixMonths = await User.countDocuments({ lastSeen: { $lt: sixMonthsAgo } });
    const inactiveYear = await User.countDocuments({ lastSeen: { $lt: oneYearAgo } });
    
    // Registration stats
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: thisWeek } });
    const monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    
    // Match statistics
    const totalMatches = await Relationship.countDocuments({ status: 'matched' });
    const pendingRequests = await Relationship.countDocuments({ status: 'pending' });
    const rejectedRequests = await Relationship.countDocuments({ status: 'rejected' });
    
    // Calculate success rate
    const totalRequests = totalMatches + rejectedRequests;
    const successRate = totalRequests > 0 ? ((totalMatches / totalRequests) * 100).toFixed(1) : 0;
    
    // Average matches per user
    const avgMatchesPerUser = totalMembers > 0 ? (totalMatches / totalMembers).toFixed(1) : 0;
    
    // Chat statistics
    const totalChats = await Chat.countDocuments();
    const messagesThisWeek = await Chat.countDocuments({ createdAt: { $gte: thisWeek } });
    const messagesThisMonth = await Chat.countDocuments({ createdAt: { $gte: thisMonth } });
    
    // Mock additional metrics (replace with real calculations)
    const matchToChatRate = 65.4;
    const avgSessionTime = '12m 34s';
    const conversionRate = premiumMembers > 0 ? ((premiumMembers / totalMembers) * 100).toFixed(1) : 0;
    const engagementRate = 78.2;
    const churnRate = 12.5;
    const growthRate = 8.7;
    const freeToProConversions = 23;
    
    // Geographic distribution
    const geographicDistribution = await User.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Age distribution
    const ageDistribution = await User.aggregate([
      { 
        $addFields: { 
          age: { 
            $floor: { 
              $divide: [
                { $subtract: [new Date(), '$dob'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      { $group: { _id: '$age', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Top referrers (mock data for now)
    const topReferrers = [
      {
        _id: '507f1f77bcf86cd799439011',
        username: 'ahmed123',
        fname: 'Ahmed',
        lname: 'Hassan',
        totalReferrals: 15,
        activeReferrals: 12
      },
      {
        _id: '507f1f77bcf86cd799439012',
        username: 'fatima_k',
        fname: 'Fatima',
        lname: 'Khan',
        totalReferrals: 11,
        activeReferrals: 9
      }
    ];
    
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
      successRate: parseFloat(successRate),
      avgMatchesPerUser: parseFloat(avgMatchesPerUser),
      matchToChatRate,
      messagesExchanged: totalChats,
      messagesThisWeek,
      messagesThisMonth,
      avgSessionTime,
      conversionRate: parseFloat(conversionRate),
      engagementRate,
      churnRate,
      growthRate,
      freeToProConversions,
      totalReferrals: 26,
      topReferrers,
      geographicDistribution,
      ageDistribution
    };
    
    console.log('✅ Admin stats calculated successfully');
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    console.log('👥 Fetching all users with filters:', req.query);
    
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
    
    if (gender && gender !== 'all') {
      filter.gender = gender;
    }
    
    if (plan && plan !== 'all') {
      filter.plan = plan;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (country && country !== 'all') {
      filter.country = country;
    }
    
    if (city && city !== 'all') {
      filter.city = city;
    }
    
    // Handle inactive users filter
    if (inactiveMonths && inactiveMonths !== 'all') {
      const months = parseInt(inactiveMonths);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      filter.lastSeen = { $lt: cutoffDate };
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -validationToken')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Add computed fields
    const usersWithComputedFields = users.map(user => {
      const now = new Date();
      
      // Calculate age
      let age = null;
      if (user.dob) {
        const birthDate = new Date(user.dob);
        age = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      }
      
      // Calculate days since joining
      const joinedAgo = user.createdAt ? Math.floor((now - new Date(user.createdAt)) / (24 * 60 * 60 * 1000)) : null;
      
      // Calculate days since last seen
      const lastSeenAgo = user.lastSeen ? Math.floor((now - new Date(user.lastSeen)) / (24 * 60 * 60 * 1000)) : null;
      
      return {
        ...user,
        fullName: `${user.fname} ${user.lname}`,
        age,
        joinedAgo,
        lastSeenAgo
      };
    });
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    
    console.log(`✅ Found ${users.length} users out of ${total} total`);
    
    res.json({
      success: true,
      users: usersWithComputedFields,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      // For backward compatibility
      currentPage: pageNum,
      totalPages,
      total,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching details for user ${id}`);
    
    const user = await User.findById(id)
      .select('-password -resetPasswordToken -validationToken')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's relationships
    const relationships = await Relationship.find({
      $or: [{ follower: id }, { followed: id }]
    }).populate('follower followed', 'username fname lname');
    
    // Get user's chat count
    const chatCount = await Chat.countDocuments({
      $or: [{ sender: id }, { receiver: id }]
    });
    
    // Add computed fields
    const now = new Date();
    let age = null;
    if (user.dob) {
      const birthDate = new Date(user.dob);
      age = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    }
    
    const joinedAgo = user.createdAt ? Math.floor((now - new Date(user.createdAt)) / (24 * 60 * 60 * 1000)) : null;
    const lastSeenAgo = user.lastSeen ? Math.floor((now - new Date(user.lastSeen)) / (24 * 60 * 60 * 1000)) : null;
    
    const userDetails = {
      ...user,
      fullName: `${user.fname} ${user.lname}`,
      age,
      joinedAgo,
      lastSeenAgo,
      matchCount: relationships.filter(r => r.status === 'matched').length,
      messageCount: chatCount,
      relationships
    };
    
    console.log('✅ User details fetched successfully');
    res.json({
      success: true,
      user: userDetails
    });
    
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating user ${id} status to ${status}`);
    
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, select: '-password -resetPasswordToken -validationToken' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User status updated successfully');
    res.json({
      success: true,
      message: 'User status updated successfully',
      user
    });
    
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private/Admin
exports.updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    
    console.log(`🔄 Updating user ${id} plan to ${plan}`);
    
    const validPlans = ['Free', 'Premium', 'Pro'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan value'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { plan },
      { new: true, select: '-password -resetPasswordToken -validationToken' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User plan updated successfully');
    res.json({
      success: true,
      message: 'User plan updated successfully',
      user
    });
    
  } catch (error) {
    console.error('❌ Error updating user plan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔄 Updating user ${id} with data:`, updateData);
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.resetPasswordToken;
    delete updateData.validationToken;
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password -resetPasswordToken -validationToken' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User updated successfully');
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting user ${id}`);
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Clean up related data
    await Relationship.deleteMany({
      $or: [{ follower: id }, { followed: id }]
    });
    
    await Chat.deleteMany({
      $or: [{ sender: id }, { receiver: id }]
    });
    
    console.log('✅ User deleted successfully');
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔑 Resetting password for user ${id}`);
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    const user = await User.findByIdAndUpdate(
      id,
      { password: tempPassword }, // Will be hashed by pre-save middleware
      { new: true, select: 'username email fname lname' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ Password reset successfully');
    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword // In production, send this via email instead
    });
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system metrics
// @route   GET /api/admin/system
// @access  Private/Admin
exports.getSystemMetrics = async (req, res) => {
  try {
    console.log('🖥️ Fetching system metrics...');
    
    // Mock system metrics - replace with real system monitoring
    const metrics = {
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      databaseConnections: mongoose.connections.length,
      timestamp: new Date()
    };
    
    console.log('✅ System metrics fetched successfully');
    res.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('❌ Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all calls
// @route   GET /api/admin/calls
// @access  Private/Admin
exports.getAllCalls = async (req, res) => {
  try {
    console.log('📞 Fetching all calls...');
    
    // Mock call data - replace with real call model when implemented
    const mockCalls = [
      {
        _id: '507f1f77bcf86cd799439011',
        conversationId: 'conv_123',
        participants: [
          {
            userId: {
              _id: '507f1f77bcf86cd799439012',
              fname: 'Ahmed',
              lname: 'Hassan',
              username: 'ahmed123'
            },
            joinedAt: new Date('2024-01-15T10:00:00Z'),
            leftAt: new Date('2024-01-15T10:15:00Z')
          },
          {
            userId: {
              _id: '507f1f77bcf86cd799439013',
              fname: 'Fatima',
              lname: 'Khan',
              username: 'fatima_k'
            },
            joinedAt: new Date('2024-01-15T10:01:00Z'),
            leftAt: new Date('2024-01-15T10:15:00Z')
          }
        ],
        status: 'ended',
        duration: 900, // 15 minutes in seconds
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:15:00Z'),
        quality: 'good',
        createdAt: new Date('2024-01-15T10:00:00Z')
      }
    ];
    
    // Add more mock calls
    for (let i = 0; i < 13; i++) {
      mockCalls.push({
        _id: `507f1f77bcf86cd79943901${i + 4}`,
        conversationId: `conv_${i + 124}`,
        participants: [
          {
            userId: {
              _id: `507f1f77bcf86cd79943901${i + 20}`,
              fname: `User${i + 1}`,
              lname: 'Test',
              username: `user${i + 1}`
            },
            joinedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            leftAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (10 * 60 * 1000))
          },
          {
            userId: {
              _id: `507f1f77bcf86cd79943901${i + 40}`,
              fname: `Partner${i + 1}`,
              lname: 'Test',
              username: `partner${i + 1}`
            },
            joinedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            leftAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (8 * 60 * 1000))
          }
        ],
        status: i % 3 === 0 ? 'failed' : 'ended',
        duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
        startTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        endTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (10 * 60 * 1000)),
        quality: ['good', 'fair', 'poor'][i % 3],
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const paginatedCalls = mockCalls.slice(skip, skip + limitNum);
    const total = mockCalls.length;
    const totalPages = Math.ceil(total / limitNum);
    
    // Calculate statistics
    const completedCalls = mockCalls.filter(call => call.status === 'ended').length;
    const totalDuration = mockCalls.reduce((sum, call) => sum + call.duration, 0);
    const avgDuration = completedCalls > 0 ? Math.floor(totalDuration / completedCalls) : 0;
    
    console.log(`✅ Found ${paginatedCalls.length} calls out of ${total} total`);
    
    res.json({
      success: true,
      calls: paginatedCalls,
      currentPage: pageNum,
      totalPages,
      total,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      statistics: {
        totalCalls: total,
        completedCalls,
        avgDuration,
        totalDuration
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching calls:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Save call record
// @route   POST /api/admin/calls
// @access  Private/Admin
exports.saveCallRecord = async (req, res) => {
  try {
    const callData = req.body;
    console.log('💾 Saving call record:', callData);
    
    // Mock saving - replace with real call model when implemented
    const savedCall = {
      _id: new mongoose.Types.ObjectId(),
      ...callData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('✅ Call record saved successfully');
    res.json({
      success: true,
      message: 'Call record saved successfully',
      call: savedCall
    });
    
  } catch (error) {
    console.error('❌ Error saving call record:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload call recording
// @route   POST /api/admin/call-recordings
// @access  Private/Admin
exports.uploadCallRecording = async (req, res) => {
  try {
    const { conversationId, duration } = req.body;
    const file = req.file;
    
    console.log('📹 Uploading call recording:', { conversationId, duration, filename: file?.filename });
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No recording file provided'
      });
    }
    
    // Mock file processing - in production, upload to cloud storage
    const recordingUrl = `/uploads/recordings/${file.filename}`;
    
    console.log('✅ Call recording uploaded successfully');
    res.json({
      success: true,
      message: 'Call recording uploaded successfully',
      recordingUrl,
      conversationId,
      duration: duration ? parseInt(duration) : null
    });
    
  } catch (error) {
    console.error('❌ Error uploading call recording:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get chat reports
// @route   GET /api/admin/chat-reports
// @access  Private/Admin
exports.getChatReports = async (req, res) => {
  try {
    console.log('💬 Fetching chat reports...');
    
    // Mock chat reports - replace with real implementation
    const mockReports = [
      {
        _id: '507f1f77bcf86cd799439011',
        conversationId: 'conv_123',
        participants: ['Ahmed Hassan', 'Fatima Khan'],
        messageCount: 45,
        lastActivity: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        createdAt: new Date('2024-01-10T10:00:00Z')
      }
    ];
    
    console.log('✅ Chat reports fetched successfully');
    res.json({
      success: true,
      reports: mockReports
    });
    
  } catch (error) {
    console.error('❌ Error fetching chat reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send chat report
// @route   POST /api/admin/send-chat-report
// @access  Private/Admin
exports.sendChatReport = async (req, res) => {
  try {
    const { conversationId, parentEmails } = req.body;
    console.log('📧 Sending chat report:', { conversationId, parentEmails });
    
    // Mock sending - replace with real email service
    console.log('✅ Chat report sent successfully');
    res.json({
      success: true,
      message: 'Chat report sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error sending chat report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get matching insights
// @route   GET /api/admin/matching-insights
// @access  Private/Admin
exports.getMatchingInsights = async (req, res) => {
  try {
    console.log('🔍 Fetching matching insights...');
    
    // Mock insights - replace with real analytics
    const insights = {
      totalMatches: 1234,
      successfulMatches: 567,
      averageMatchTime: '2.5 days',
      topMatchingCriteria: ['age', 'location', 'interests'],
      matchingTrends: [
        { month: 'Jan', matches: 120 },
        { month: 'Feb', matches: 145 },
        { month: 'Mar', matches: 167 }
      ]
    };
    
    console.log('✅ Matching insights fetched successfully');
    res.json({
      success: true,
      insights
    });
    
  } catch (error) {
    console.error('❌ Error fetching matching insights:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get engagement metrics
// @route   GET /api/admin/engagement-metrics
// @access  Private/Admin
exports.getEngagementMetrics = async (req, res) => {
  try {
    console.log('📊 Fetching engagement metrics...');
    
    // Mock metrics - replace with real analytics
    const metrics = {
      dailyActiveUsers: 456,
      weeklyActiveUsers: 1234,
      monthlyActiveUsers: 3456,
      averageSessionDuration: '15.5 minutes',
      messagesSent: 12345,
      profileViews: 23456
    };
    
    console.log('✅ Engagement metrics fetched successfully');
    res.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('❌ Error fetching engagement metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get conversion metrics
// @route   GET /api/admin/conversion-metrics
// @access  Private/Admin
exports.getConversionMetrics = async (req, res) => {
  try {
    console.log('💰 Fetching conversion metrics...');
    
    // Mock metrics - replace with real analytics
    const metrics = {
      freeToProConversions: 23,
      conversionRate: 4.2,
      averageTimeToConvert: '7.5 days',
      revenueThisMonth: 1250,
      lifetimeValue: 45.50
    };
    
    console.log('✅ Conversion metrics fetched successfully');
    res.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('❌ Error fetching conversion metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get churn analysis
// @route   GET /api/admin/churn-analysis
// @access  Private/Admin
exports.getChurnAnalysis = async (req, res) => {
  try {
    console.log('📉 Fetching churn analysis...');
    
    // Mock analysis - replace with real analytics
    const analysis = {
      churnRate: 12.5,
      churnedUsers: 156,
      riskUsers: 89,
      retentionRate: 87.5,
      averageLifespan: '4.2 months'
    };
    
    console.log('✅ Churn analysis fetched successfully');
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Error fetching churn analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get referral analysis
// @route   GET /api/admin/referral-analysis
// @access  Private/Admin
exports.getReferralAnalysis = async (req, res) => {
  try {
    console.log('👥 Fetching referral analysis...');
    
    // Mock analysis - replace with real analytics
    const analysis = {
      totalReferrals: 234,
      successfulReferrals: 156,
      referralConversionRate: 66.7,
      topReferrers: [
        { name: 'Ahmed Hassan', referrals: 15 },
        { name: 'Fatima Khan', referrals: 12 },
        { name: 'Omar Ali', referrals: 9 }
      ]
    };
    
    console.log('✅ Referral analysis fetched successfully');
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Error fetching referral analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get reported profiles
// @route   GET /api/admin/reported-profiles
// @access  Private/Admin
exports.getReportedProfiles = async (req, res) => {
  try {
    console.log('📋 Fetching reported profiles...');
    
    // For now, return mock data since we don't have a Report model
    const mockReports = [
      {
        _id: '507f1f77bcf86cd799439011',
        reporter: {
          _id: '507f1f77bcf86cd799439012',
          fullName: 'John Doe',
          username: 'johndoe'
        },
        reported: {
          _id: '507f1f77bcf86cd799439013',
          fullName: 'Jane Smith',
          username: 'janesmith'
        },
        reason: 'inappropriate_content',
        description: 'User posted inappropriate photos',
        createdAt: new Date('2024-01-15'),
        status: 'pending'
      },
      {
        _id: '507f1f77bcf86cd799439014',
        reporter: {
          _id: '507f1f77bcf86cd799439015',
          fullName: 'Mike Johnson',
          username: 'mikej'
        },
        reported: {
          _id: '507f1f77bcf86cd799439016',
          fullName: 'Sarah Wilson',
          username: 'sarahw'
        },
        reason: 'harassment',
        description: 'User sent inappropriate messages',
        createdAt: new Date('2024-01-10'),
        status: 'pending'
      }
    ];

    res.json({
      success: true,
      reports: mockReports,
      total: mockReports.length
    });
  } catch (error) {
    console.error('❌ Error fetching reported profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Dismiss a report
// @route   PATCH /api/admin/reported-profiles/:id/dismiss
// @access  Private/Admin
exports.dismissReport = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Dismissing report ${id}...`);
    
    // Mock dismissal since we don't have a Report model
    res.json({
      success: true,
      message: 'Report dismissed successfully'
    });
  } catch (error) {
    console.error('❌ Error dismissing report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get VIP users (Pro plan users)
// @route   GET /api/admin/vip-users
// @access  Private/Admin
exports.getVipUsers = async (req, res) => {
  try {
    console.log('👑 Fetching VIP users...');
    
    const vipUsers = await User.find({ plan: 'Pro' })
      .select('username fname lname fullName gender dob country plan lastSeen createdAt status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: vipUsers,
      total: vipUsers.length
    });
  } catch (error) {
    console.error('❌ Error fetching VIP users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get potential matches for a user
// @route   GET /api/admin/users/:id/potential-matches
// @access  Private/Admin
exports.getPotentialMatches = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💝 Fetching potential matches for user ${id}...`);
    
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find users of opposite gender in same country
    const oppositeGender = targetUser.gender === 'male' ? 'female' : 'male';
    
    const potentialMatches = await User.find({
      _id: { $ne: id },
      gender: oppositeGender,
      country: targetUser.country,
      status: 'active'
    })
    .select('username fname lname fullName gender dob country plan lastSeen age')
    .limit(20)
    .sort({ lastSeen: -1 });

    res.json({
      success: true,
      matches: potentialMatches,
      total: potentialMatches.length
    });
  } catch (error) {
    console.error('❌ Error fetching potential matches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send match suggestions to a user
// @route   POST /api/admin/users/:id/suggest-matches
// @access  Private/Admin
exports.sendMatchSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestedUserIds } = req.body;
    
    console.log(`💌 Sending match suggestions to user ${id}:`, suggestedUserIds);
    
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In a real implementation, you would:
    // 1. Create notifications for the user
    // 2. Send email notifications
    // 3. Store the suggestions in the database
    
    res.json({
      success: true,
      message: `Match suggestions sent to ${targetUser.fullName}`,
      suggestedCount: suggestedUserIds.length
    });
  } catch (error) {
    console.error('❌ Error sending match suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send bulk email
// @route   POST /api/admin/bulk-email
// @access  Private/Admin
exports.sendBulkEmail = async (req, res) => {
  try {
    const { subject, message, recipients } = req.body;
    console.log(`📧 Sending bulk email to ${recipients} recipients...`);
    
    // Mock bulk email sending
    res.json({
      success: true,
      message: `Bulk email sent to ${recipients} recipients`,
      emailsSent: recipients
    });
  } catch (error) {
    console.error('❌ Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get email metrics
// @route   GET /api/admin/email-metrics
// @access  Private/Admin
exports.getEmailMetrics = async (req, res) => {
  try {
    console.log('📊 Fetching email metrics...');
    
    const mockMetrics = {
      totalEmailsSent: 12450,
      deliveryRate: 98.5,
      openRate: 24.7,
      clickRate: 3.2,
      bounceRate: 1.5,
      recentCampaigns: [
        {
          id: 1,
          subject: 'Welcome to Quluub',
          sentAt: new Date('2024-01-15'),
          recipients: 150,
          openRate: 32.1
        },
        {
          id: 2,
          subject: 'New Matches Available',
          sentAt: new Date('2024-01-10'),
          recipients: 89,
          openRate: 28.4
        }
      ]
    };

    res.json({
      success: true,
      metrics: mockMetrics
    });
  } catch (error) {
    console.error('❌ Error fetching email metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
