const User = require('../models/User');
const Call = require('../models/Call');
const PushNotification = require('../models/PushNotification');
const Chat = require('../models/Chat');
const Relationship = require('../models/Relationship');
const ScheduledEmail = require('../models/ScheduledEmail');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const UserActivityLog = require('../models/UserActivityLog');
const WaliChat = require('../models/WaliChat');
const Report = require('../models/Report');
const crypto = require('crypto');
const { sendBulkEmail: sendBulkEmailService, sendTestEmail: sendTestEmailService, updateEmailConfig, getEmailConfigService, getEmailMetricsService } = require('../utils/emailService');
const { sendPushNotification: sendPushNotificationService } = require('../utils/pushNotificationService');
const { getCountryName } = require('../utils/countryUtils');

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // User Stats
    const totalMembers = await User.countDocuments();
    const maleMembers = await User.countDocuments({ gender: 'male' });
    const femaleMembers = await User.countDocuments({ gender: 'female' });
    const premiumMembers = await User.countDocuments({ plan: 'premium' });
    const proMembers = await User.countDocuments({ plan: 'pro' });
    const hiddenProfiles = await User.countDocuments({ isHidden: true });
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    // Activity Stats
    const activeToday = await User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    const activeThisWeek = await User.countDocuments({ lastSeen: { $gte: oneWeekAgo } });
    const activeThisMonth = await User.countDocuments({ lastSeen: { $gte: oneMonthAgo } });

    // Inactivity Stats
    const inactiveUsers = await User.countDocuments({ lastSeen: { $lt: oneMonthAgo } });
    const inactiveQuarter = await User.countDocuments({ lastSeen: { $lt: threeMonthsAgo } });
    const inactiveSixMonths = await User.countDocuments({ lastSeen: { $lt: sixMonthsAgo } });
    const inactiveYear = await User.countDocuments({ lastSeen: { $lt: oneYearAgo } });

    // Match Stats
    const totalMatches = await Relationship.countDocuments({ status: 'matched' });
    const pendingRequests = await Relationship.countDocuments({ status: 'pending' });
    const rejectedRequests = await Relationship.countDocuments({ status: 'rejected' });
    const successRate = totalMatches > 0 ? (totalMatches / (totalMatches + rejectedRequests)) * 100 : 0;
    const avgMatchesPerUser = totalMembers > 0 ? totalMatches / totalMembers : 0;

    // Communication Stats
    const messagesExchanged = await Chat.countDocuments();
    const messagesThisWeek = await Chat.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const messagesThisMonth = await Chat.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    const matchToChatRate = totalMatches > 0 ? (await Chat.distinct('conversationId')).length / totalMatches * 100 : 0;

    // Financial & Growth Stats
    const totalSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const conversionRate = totalMembers > 0 ? (totalSubscriptions / totalMembers) * 100 : 0;
    const freeToProConversions = await Subscription.countDocuments({ plan: { $in: ['premium', 'pro'] }, createdAt: { $gte: oneMonthAgo } });

    // Corrected Churn & Growth Rate Calculations
    const membersAtStartOfMonth = await User.countDocuments({ createdAt: { $lt: oneMonthAgo } });
    const churnedUsersLastMonth = await User.countDocuments({ status: 'inactive', lastSeen: { $lt: oneMonthAgo, $gte: threeMonthsAgo } }); // Example: users who became inactive last month
    const churnRate = membersAtStartOfMonth > 0 ? (churnedUsersLastMonth / membersAtStartOfMonth) * 100 : 0;
    const growthRate = membersAtStartOfMonth > 0 ? ((totalMembers - membersAtStartOfMonth) / membersAtStartOfMonth) * 100 : 0;

    // Engagement Rate
    const engagementRate = totalMembers > 0 ? (activeThisWeek / totalMembers) * 100 : 0;

    // Geographic & Referral Stats
    const geographicDistribution = await User.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: '$_id', count: '$count' } },
    ]);
    const topReferrers = await User.aggregate([
      { $match: { referredBy: { $exists: true } } },
      { $group: { _id: '$referredBy', totalReferrals: { $sum: 1 } } },
      { $sort: { totalReferrals: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'referrerInfo' } },
      { $unwind: '$referrerInfo' },
      { $project: { _id: 0, fname: '$referrerInfo.fname', lname: '$referrerInfo.lname', username: '$referrerInfo.username', totalReferrals: '$totalReferrals' } },
    ]);

    res.json({
      totalMembers, maleMembers, femaleMembers, premiumMembers, proMembers, hiddenProfiles, recentRegistrations, monthlyRegistrations,
      activeToday, activeThisWeek, activeThisMonth,
      inactiveUsers, inactiveQuarter, inactiveSixMonths, inactiveYear,
      totalMatches, pendingRequests, rejectedRequests, successRate: successRate.toFixed(2), avgMatchesPerUser: avgMatchesPerUser.toFixed(2),
      messagesExchanged, messagesThisWeek, messagesThisMonth, matchToChatRate: matchToChatRate.toFixed(2),
      conversionRate: conversionRate.toFixed(2), freeToProConversions, churnRate: churnRate.toFixed(2), growthRate: growthRate.toFixed(2), engagementRate: engagementRate.toFixed(2),
      geographicDistribution, topReferrers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      gender,
      plan,
      status,
      country,
      city,
      inactiveFor
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    if (plan && plan !== 'all') {
      query.plan = plan;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (inactiveFor && inactiveFor !== 'all') {
      const days = parseInt(inactiveFor, 10);
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.lastSeen = { $lt: date };
      }
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      users,
      pagination: {
        total: totalUsers,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        hasNextPage: parseInt(page) * parseInt(limit) < totalUsers,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserAccountStatus = async (req, res) => {
  try {
    const { status, reportId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status || user.status;
    const updatedUser = await user.save();

    // If a reportId is provided, update the report status to 'action_taken'
    if (reportId) {
      const report = await Report.findById(reportId);
      if (report) {
        report.status = 'action_taken';
        await report.save();
      }
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private/Admin
const updateUserPlan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.plan = req.body.plan || user.plan;
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.fname = req.body.fname || user.fname;
      user.lname = req.body.lname || user.lname;
      user.email = req.body.email || user.email;
      user.plan = req.body.plan || user.plan;
      user.status = req.body.status || user.status;
      user.isVerified = req.body.isVerified;
      user.city = req.body.city || user.city;
      user.country = req.body.country || user.country;
      user.gender = req.body.gender || user.gender;
      user.dob = req.body.dob || user.dob;
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove all associated data
    await Relationship.deleteMany({ $or: [{ user1: userId }, { user2: userId }] }, { session });
    await Chat.deleteMany({ participants: userId }, { session });
    await Notification.deleteMany({ recipient: userId }, { session });
    await Payment.deleteMany({ user: userId }, { session });
    await Subscription.deleteMany({ user: userId }, { session });
    await UserActivityLog.deleteMany({ user: userId }, { session });
    await WaliChat.deleteMany({ participants: userId }, { session });
    await PushNotification.deleteMany({ recipient: userId }, { session });

    // Remove user from other users' arrays (e.g., blocked, favorites)
    await User.updateMany({}, { $pull: { blockedUsers: userId, favoriteUsers: userId, viewedBy: userId } }, { session });

    // Finally, delete the user
    await User.deleteOne({ _id: userId }, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'User and all associated data have been successfully deleted.' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during user deletion:', error);
    res.status(500).json({ message: 'Server error during user deletion process.' });
  }
};

// @desc    Manually verify user email
// @route   POST /api/admin/users/:id/verify-email
// @access  Private/Admin
const verifyUserEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isVerified = true;
      await user.save();
      res.json({ message: 'User email verified successfully.' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send password reset link to user
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
const sendPasswordResetLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // This URL should point to your frontend's password reset page
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const message = `You are receiving this email because you (or an administrator) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste it into your browser to complete the process within one hour of receiving it:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

      try {
        await sendBulkEmailService([user], 'Password Reset Request', message);
        res.json({ message: 'Password reset link sent to user.' });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.status(500).json({ message: 'Error sending password reset email.' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system metrics
// @route   GET /api/admin/system
// @access  Private/Admin
const getSystemMetrics = async (req, res) => {
  try {
    res.json({ cpuUsage: '75%', memoryUsage: '60%', diskUsage: '80%' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all calls
// @route   GET /api/admin/calls
// @access  Private/Admin
const getAllCalls = async (req, res) => {
  try {
        const calls = await Call.find({}).populate('caller recipient', 'fname lname');
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save call record
// @route   POST /api/admin/calls
// @access  Private/Admin
const saveCallRecord = async (req, res) => {
  try {
    const newCall = new Call(req.body);
    const savedCall = await newCall.save();
    res.status(201).json(savedCall);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload call recording
// @route   POST /api/admin/call-recordings
// @access  Private/Admin
const getReportedProfiles = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'fname lname username')
      .populate('reported', 'fname lname username')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reported profiles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const dismissReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    report.status = 'dismissed';
    await report.save();
    res.json({ message: 'Report dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadCallRecording = async (req, res) => {
  try {
    if (req.file) {
      res.json({ message: 'File uploaded successfully', path: req.file.path });
    } else {
      res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send bulk email
// @route   POST /api/admin/bulk-email
// @access  Private/Admin
const sendBulkEmail = async (req, res) => {
  try {
    const { userIds, subject, message, sendToAll } = req.body;
    let users = [];

    if (sendToAll === 'true') {
      users = await User.find({});
    } else {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one user.' });
      }
      users = await User.find({ '_id': { $in: userIds } });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found to send email to.' });
    }

    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }

    await sendBulkEmailService(users, subject, message, attachments);
    res.json({ message: `Bulk email sent successfully to ${users.length} users.` });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ message: 'Failed to send bulk email.' });
  }
};

// @desc    Send test email
// @route   POST /api/admin/test-email
// @access  Private/Admin
const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    await sendTestEmailService(email);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
};

// @desc    Get email config
// @route   GET /api/admin/email-config
// @access  Private/Admin
const getEmailConfig = async (req, res) => {
  try {
    const config = await getEmailConfigService();
    res.json(config);
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save email config
// @route   POST /api/admin/email-config
// @access  Private/Admin
const saveEmailConfig = async (req, res) => {
  try {
    const success = await updateEmailConfig(req.body);
    if (success) {
      res.json({ message: 'Email config updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update email config' });
    }
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get email metrics
// @route   GET /api/admin/email-metrics
// @access  Private/Admin
const getEmailMetrics = async (req, res) => {
  try {
    const metrics = await getEmailMetricsService();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching email metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getReportedProfiles,
  dismissReport,
  getAdminPushNotifications,
  scheduleEmail,
  getScheduledEmails,
  cancelScheduledEmail,
  getStats,
  getAllUsers,
  getUserDetails,
  updateUserAccountStatus,
  updateUserPlan,
  updateUser,
  deleteUser,
  sendPasswordResetLink,
  verifyUserEmail,
  getSystemMetrics,
  getAllCalls,
  saveCallRecord,
  uploadCallRecording,
  sendBulkEmail,
  sendTestEmail,
  getEmailMetrics,
  saveEmailConfig,
  getEmailConfig,
  getMatchingInsights,
  getEngagementMetrics,
  getConversionMetrics,
  getChurnAnalysis,
  getReferralAnalysis,
  getChatReports,
  getReportedProfiles,
  sendChatReport,
  dismissReport,
  getVipUsers,
  getPotentialMatches,
  processRefund,
  getPaymentHistory,
  sendMatchSuggestions,
  getReportDetails,
  resolveReport,
  getSystemSettings,
  sendAdminNotification,
  getAdminNotifications,
  markNotificationAsRead,
  sendAdminPushNotification,
  getAdminPushNotifications,
  getEmailConfig,
  saveEmailConfig,
  getEmailMetrics
};
