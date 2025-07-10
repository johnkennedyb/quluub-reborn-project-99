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
    const proMembers = 0; // No pro plan anymore
    const hiddenProfiles = await User.countDocuments({ hidden: true });
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const monthlyRegistrations = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    // Activity Stats - Fixed inactive user calculation
    const activeToday = await User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    const activeThisWeek = await User.countDocuments({ lastSeen: { $gte: oneWeekAgo } });
    const activeThisMonth = await User.countDocuments({ lastSeen: { $gte: oneMonthAgo } });

    // Inactivity Stats - Fixed calculations
    const inactiveUsers = await User.countDocuments({ 
      $or: [
        { lastSeen: { $lt: oneMonthAgo } },
        { lastSeen: { $exists: false } }
      ]
    });
    const inactiveQuarter = await User.countDocuments({ 
      $or: [
        { lastSeen: { $lt: threeMonthsAgo } },
        { lastSeen: { $exists: false } }
      ]
    });
    const inactiveSixMonths = await User.countDocuments({ 
      $or: [
        { lastSeen: { $lt: sixMonthsAgo } },
        { lastSeen: { $exists: false } }
      ]
    });
    const inactiveYear = await User.countDocuments({ 
      $or: [
        { lastSeen: { $lt: oneYearAgo } },
        { lastSeen: { $exists: false } }
      ]
    });

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
    const freeToProConversions = await Subscription.countDocuments({ plan: 'premium', createdAt: { $gte: oneMonthAgo } });

    // Corrected Churn & Growth Rate Calculations
    const membersAtStartOfMonth = await User.countDocuments({ createdAt: { $lt: oneMonthAgo } });
    const churnedUsersLastMonth = await User.countDocuments({ status: 'inactive', lastSeen: { $lt: oneMonthAgo, $gte: threeMonthsAgo } });
    const churnRate = membersAtStartOfMonth > 0 ? (churnedUsersLastMonth / membersAtStartOfMonth) * 100 : 0;
    const growthRate = membersAtStartOfMonth > 0 ? ((totalMembers - membersAtStartOfMonth) / membersAtStartOfMonth) * 100 : 0;

    // Engagement Rate
    const engagementRate = totalMembers > 0 ? (activeThisWeek / totalMembers) * 100 : 0;

    // Geographic & Referral Stats - Fixed country aggregation
    const geographicDistribution = await User.aggregate([
      { $match: { country: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { country: '$_id', count: '$count' } },
    ]);

    const topReferrers = await User.aggregate([
      { $match: { referredBy: { $exists: true } } },
      { $group: { _id: '$referredBy', totalReferrals: { $sum: 1 } } },
      { $sort: { totalReferrals: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'referrerInfo' } },
      { $unwind: '$referrerInfo' },
      { $project: { 
        _id: '$_id', 
        fname: '$referrerInfo.fname', 
        lname: '$referrerInfo.lname', 
        username: '$referrerInfo.username', 
        totalReferrals: '$totalReferrals',
        activeReferrals: '$totalReferrals' // Simplified for now
      } },
    ]);

    // Age distribution
    const ageDistribution = await User.aggregate([
      { $match: { dob: { $exists: true } } },
      { $addFields: { 
        age: { 
          $floor: { 
            $divide: [{ $subtract: [new Date(), '$dob'] }, 1000 * 60 * 60 * 24 * 365] 
          } 
        } 
      }},
      { $group: { _id: '$age', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalMembers, maleMembers, femaleMembers, premiumMembers, proMembers, hiddenProfiles, recentRegistrations, monthlyRegistrations,
      activeToday, activeThisWeek, activeThisMonth,
      inactiveUsers, inactiveQuarter, inactiveSixMonths, inactiveYear,
      totalMatches, pendingRequests, rejectedRequests, successRate: successRate.toFixed(2), avgMatchesPerUser: avgMatchesPerUser.toFixed(2),
      messagesExchanged, messagesThisWeek, messagesThisMonth, matchToChatRate: matchToChatRate.toFixed(2),
      conversionRate: conversionRate.toFixed(2), freeToProConversions, churnRate: churnRate.toFixed(2), growthRate: growthRate.toFixed(2), engagementRate: engagementRate.toFixed(2),
      geographicDistribution, topReferrers, ageDistribution,
      totalReferrals: topReferrers.reduce((sum, ref) => sum + ref.totalReferrals, 0)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users with enhanced filtering
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
      // Map plan correctly - only freemium and premium
      if (plan === 'free') {
        query.plan = 'freemium';
      } else if (plan === 'premium') {
        query.plan = 'premium';
      }
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

    // Fixed inactivity filtering
    if (inactiveFor && inactiveFor !== 'all') {
      const days = parseInt(inactiveFor, 10);
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.$or = [
          { lastSeen: { $lt: date } },
          { lastSeen: { $exists: false } }
        ];
      }
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -validationToken -resetPasswordToken')
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    // Enhanced user data with calculated fields
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Calculate age
      if (user.dob) {
        const age = Math.floor((Date.now() - user.dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
        userObj.age = age;
      }

      // Calculate days since last seen
      if (user.lastSeen) {
        const daysSinceLastSeen = Math.floor((Date.now() - user.lastSeen.getTime()) / (1000 * 60 * 60 * 24));
        userObj.lastSeenAgo = daysSinceLastSeen;
      } else {
        userObj.lastSeenAgo = null;
      }

      // Calculate days since joining
      if (user.createdAt) {
        const daysSinceJoining = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        userObj.joinedAgo = daysSinceJoining;
      }

      // Get match and message counts
      const matchCount = await Relationship.countDocuments({
        $or: [{ user1: user._id }, { user2: user._id }],
        status: 'matched'
      });

      const messageCount = await Chat.countDocuments({
        participants: user._id
      });

      userObj.matchCount = matchCount;
      userObj.messageCount = messageCount;
      userObj.fullName = `${user.fname} ${user.lname}`;

      return userObj;
    }));

    res.json({
      users: enhancedUsers,
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      hasNextPage: parseInt(page) * parseInt(limit) < totalUsers,
      hasPrevPage: parseInt(page) > 1,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get VIP users (Premium users)
// @route   GET /api/admin/vip-users
// @access  Private/Admin
const getVipUsers = async (req, res) => {
  try {
    const vipUsers = await User.find({ 
      plan: 'premium',
      status: 'active'
    })
    .select('-password -validationToken -resetPasswordToken')
    .sort({ createdAt: -1 })
    .limit(50);

    const enhancedVips = await Promise.all(vipUsers.map(async (user) => {
      const userObj = user.toObject();
      
      // Calculate age
      if (user.dob) {
        const age = Math.floor((Date.now() - user.dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
        userObj.age = age;
      }

      // Get match count
      const matchCount = await Relationship.countDocuments({
        $or: [{ user1: user._id }, { user2: user._id }],
        status: 'matched'
      });

      userObj.matchCount = matchCount;
      userObj.fullName = `${user.fname} ${user.lname}`;

      return userObj;
    }));

    res.json({ vips: enhancedVips });
  } catch (error) {
    console.error('Error fetching VIP users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get potential matches for a user
// @route   GET /api/admin/users/:id/potential-matches
// @access  Private/Admin
const getPotentialMatches = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get users of opposite gender who are active and premium
    const oppositeGender = user.gender === 'male' ? 'female' : 'male';
    
    // Get existing relationships to exclude
    const existingRelationships = await Relationship.find({
      $or: [{ user1: userId }, { user2: userId }]
    });
    
    const excludeUserIds = existingRelationships.map(rel => 
      rel.user1.toString() === userId ? rel.user2 : rel.user1
    );
    excludeUserIds.push(userId); // Exclude self

    const potentialMatches = await User.find({
      _id: { $nin: excludeUserIds },
      gender: oppositeGender,
      status: 'active',
      plan: 'premium' // VIP users should see premium users
    })
    .select('-password -validationToken -resetPasswordToken')
    .limit(20)
    .sort({ lastSeen: -1 });

    const enhancedMatches = await Promise.all(potentialMatches.map(async (match) => {
      const matchObj = match.toObject();
      
      if (match.dob) {
        const age = Math.floor((Date.now() - match.dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
        matchObj.age = age;
      }

      matchObj.fullName = `${match.fname} ${match.lname}`;
      return matchObj;
    }));

    res.json({ matches: enhancedMatches });
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send match suggestions to user
// @route   POST /api/admin/users/:id/suggest-matches
// @access  Private/Admin
const sendMatchSuggestions = async (req, res) => {
  try {
    const userId = req.params.id;
    const { suggestedUserIds } = req.body;

    if (!suggestedUserIds || !Array.isArray(suggestedUserIds)) {
      return res.status(400).json({ message: 'Please provide valid user IDs' });
    }

    // Create notifications for suggested matches
    const notifications = suggestedUserIds.map(suggestedUserId => ({
      recipient: userId,
      type: 'admin_suggestion',
      title: 'New Match Suggestion',
      message: 'Admin has suggested a potential match for you',
      relatedUser: suggestedUserId,
      createdAt: new Date()
    }));

    await Notification.insertMany(notifications);

    res.json({ message: 'Match suggestions sent successfully' });
  } catch (error) {
    console.error('Error sending match suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Schedule email for later sending
// @route   POST /api/admin/schedule-email
// @access  Private/Admin
const scheduleEmail = async (req, res) => {
  try {
    const { userIds, subject, message, sendToAll, sendAt } = req.body;
    
    if (!sendAt) {
      return res.status(400).json({ message: 'Send time is required for scheduling' });
    }

    let recipients = [];
    if (sendToAll === 'true' || sendToAll === true) {
      // Will be populated when email is actually sent
      recipients = [];
    } else {
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: 'Please select recipients' });
      }
      recipients = userIds;
    }

    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }

    const scheduledEmail = new ScheduledEmail({
      subject,
      message,
      recipients,
      sendToAll: sendToAll === 'true' || sendToAll === true,
      sendAt: new Date(sendAt),
      attachments,
      status: 'pending'
    });

    await scheduledEmail.save();
    res.json({ message: 'Email scheduled successfully', id: scheduledEmail._id });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ message: 'Failed to schedule email' });
  }
};

// @desc    Get scheduled emails
// @route   GET /api/admin/scheduled-emails
// @access  Private/Admin
const getScheduledEmails = async (req, res) => {
  try {
    const scheduledEmails = await ScheduledEmail.find()
      .populate('recipients', 'fname lname email')
      .sort({ sendAt: 1 });
    
    res.json(scheduledEmails);
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel scheduled email
// @route   DELETE /api/admin/scheduled-emails/:id
// @access  Private/Admin
const cancelScheduledEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);
    
    if (!email) {
      return res.status(404).json({ message: 'Scheduled email not found' });
    }

    if (email.status === 'sent') {
      return res.status(400).json({ message: 'Cannot cancel already sent email' });
    }

    await ScheduledEmail.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scheduled email cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send admin push notification
// @route   POST /api/admin/push-notifications
// @access  Private/Admin
const sendAdminPushNotification = async (req, res) => {
  try {
    const { title, message, target, targetUsers } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let recipients = [];
    
    switch (target) {
      case 'all':
        recipients = await User.find({ status: 'active' }).select('_id deviceTokens');
        break;
      case 'premium':
        recipients = await User.find({ plan: 'premium', status: 'active' }).select('_id deviceTokens');
        break;
      case 'free':
        recipients = await User.find({ plan: 'freemium', status: 'active' }).select('_id deviceTokens');
        break;
      case 'inactive':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        recipients = await User.find({ 
          $or: [
            { lastSeen: { $lt: thirtyDaysAgo } },
            { lastSeen: { $exists: false } }
          ]
        }).select('_id deviceTokens');
        break;
      case 'custom':
        if (targetUsers && targetUsers.length > 0) {
          recipients = await User.find({ _id: { $in: targetUsers } }).select('_id deviceTokens');
        }
        break;
    }

    // Create notification record
    const notification = new PushNotification({
      title,
      message,
      target,
      targetUsers: target === 'custom' ? targetUsers : [],
      status: 'sent',
      sentAt: new Date(),
      sentCount: recipients.length,
      createdBy: req.user._id
    });

    await notification.save();

    // Send actual push notifications
    if (recipients.length > 0) {
      await sendPushNotificationService(recipients, { title, message });
    }

    res.json({ 
      message: 'Push notification sent successfully', 
      sentCount: recipients.length 
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Failed to send push notification' });
  }
};

// @desc    Get admin push notifications
// @route   GET /api/admin/push-notifications
// @access  Private/Admin
const getAdminPushNotifications = async (req, res) => {
  try {
    const notifications = await PushNotification.find()
      .populate('createdBy', 'fname lname')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching push notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment history
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'fname lname email username')
      .sort({ createdAt: -1 })
      .limit(100);

    const enhancedPayments = payments.map(payment => ({
      ...payment.toObject(),
      user: {
        ...payment.user.toObject(),
        fullName: `${payment.user.fname} ${payment.user.lname}`
      }
    }));

    res.json(enhancedPayments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process refund
// @route   POST /api/admin/payments/:id/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({ message: 'Payment already refunded' });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    // Update user plan if needed
    if (payment.plan !== 'freemium') {
      await User.findByIdAndUpdate(payment.user, { 
        plan: 'freemium',
        premiumExpirationDate: null
      });
    }

    res.json({ message: 'Refund processed successfully', payment });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new function for individual email sending
const sendIndividualEmail = async (req, res) => {
  try {
    const { userId, subject, message } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ message: 'User ID, subject, and message are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send individual email using the email service
    await sendBulkEmailService([user.email], subject, message, []);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending individual email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};

module.exports = {
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
  scheduleEmail,
  getScheduledEmails,
  cancelScheduledEmail,
  sendAdminPushNotification,
  getAdminPushNotifications,
  getReportedProfiles,
  dismissReport,
  getVipUsers,
  getPotentialMatches,
  sendMatchSuggestions,
  getPaymentHistory,
  processRefund,
  sendIndividualEmail,
  getMatchingInsights: async (req, res) => res.json({ message: 'Feature coming soon' }),
  getEngagementMetrics: async (req, res) => res.json({ message: 'Feature coming soon' }),
  getConversionMetrics: async (req, res) => res.json({ message: 'Feature coming soon' }),
  getChurnAnalysis: async (req, res) => res.json({ message: 'Feature coming soon' }),
  getReferralAnalysis: async (req, res) => res.json({ message: 'Feature coming soon' }),
  getChatReports: async (req, res) => res.json({ message: 'Feature coming soon' }),
  sendChatReport: async (req, res) => res.json({ message: 'Feature coming soon' })
};
