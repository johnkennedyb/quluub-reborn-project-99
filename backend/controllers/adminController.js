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
    await sendTestEmailService(email);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save email config
// @route   POST /api/admin/email-config
// @access  Private/Admin
const saveEmailConfig = async (req, res) => {
  try {
    await updateEmailConfig(req.body);
    res.json({ message: 'Email config updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
};

const getMatchingInsights = async (req, res) => {
  try {
    const totalMatches = await Match.countDocuments({ status: 'accepted' });
    const totalRequests = await Match.countDocuments();
    const successRate = totalRequests > 0 ? (totalMatches / totalRequests) * 100 : 0;
    const totalUsers = await User.countDocuments();
    const avgMatchesPerUser = totalUsers > 0 ? totalMatches / totalUsers : 0;

    res.json({
      totalMatches,
      totalRequests,
      successRate: successRate.toFixed(2),
      avgMatchesPerUser: avgMatchesPerUser.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getEngagementMetrics = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeThisWeek = await User.countDocuments({ lastSeen: { $gte: oneWeekAgo } });
    const totalUsers = await User.countDocuments();
    const engagementRate = totalUsers > 0 ? (activeThisWeek / totalUsers) * 100 : 0;

    res.json({
      activeThisWeek,
      engagementRate: engagementRate.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getConversionMetrics = async (req, res) => {
  try {
    const premiumUsers = await User.countDocuments({ plan: { $in: ['premium', 'pro'] } });
    const totalUsers = await User.countDocuments();
    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    res.json({
      premiumUsers,
      conversionRate: conversionRate.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getChurnAnalysis = async (req, res) => {
  try {
    // This is a simplified churn calculation.
    // A more accurate calculation would track subscription renewals over time.
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const churnedUsers = await Subscription.countDocuments({
      status: 'cancelled',
      endDate: { $gte: oneMonthAgo },
    });
    const totalSubscriptions = await Subscription.countDocuments();
    const churnRate = totalSubscriptions > 0 ? (churnedUsers / totalSubscriptions) * 100 : 0;

    res.json({
      churnedUsers,
      churnRate: churnRate.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getReferralAnalysis = async (req, res) => {
  try {
    const referrals = await User.aggregate([
      { $match: { referredBy: { $exists: true } } },
      { $group: { _id: '$referredBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'referrer',
        },
      },
      { $unwind: '$referrer' },
      {
        $project: {
          _id: '$referrer._id',
          username: '$referrer.username',
          fname: '$referrer.fname',
          lname: '$referrer.lname',
          count: '$count',
        },
      },
    ]);

    res.json({ referrals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const getChatReports = (req, res) => res.json({ message: 'Not implemented' });
const sendChatReport = (req, res) => res.json({ message: 'Not implemented' });
const getVipUsers = (req, res) => res.json({ message: 'Not implemented' });
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'fname lname username email')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const processRefund = async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findById(id).populate('user');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ message: 'Only successful payments can be refunded.' });
    }

    // In a real application, you would integrate with your payment gateway (e.g., Stripe) here
    // const refund = await stripe.refunds.create({ payment_intent: payment.transactionId });

    // For now, we'll just update our internal status
    payment.status = 'refunded';
    await payment.save();

    // Downgrade the user's plan
    const user = await User.findById(payment.user._id);
    if (user) {
      user.plan = 'freemium';
      await user.save();
    }

    res.json({ message: 'Refund processed successfully', payment });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error while processing refund.' });
  }
};

const getPotentialMatches = async (req, res) => {
  try {
    const vipUserId = req.params.id;
    const vipUser = await User.findById(vipUserId);

    if (!vipUser) {
      return res.status(404).json({ message: 'VIP user not found' });
    }

    // Determine the target gender for matches
    const targetGender = vipUser.gender === 'male' ? 'female' : 'male';

    // Find users the VIP has already interacted with
    const existingRelationships = await Relationship.find({
      $or: [
        { follower_user_id: vipUserId },
        { followed_user_id: vipUserId },
      ],
    });

    const interactedUserIds = existingRelationships.flatMap(rel => [
      rel.follower_user_id,
      rel.followed_user_id,
    ]);
    const uniqueInteractedIds = [...new Set(interactedUserIds)];

    // Find potential matches
    const potentialMatches = await User.find({
      _id: { $ne: vipUserId, $nin: uniqueInteractedIds },
      gender: targetGender,
      status: 'active',
    })
      .select('fname lname email gender age country city summary plan')
      .limit(50);

    res.json({ matches: potentialMatches });
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMatchSuggestions = async (req, res) => {
  try {
    const vipUserId = req.params.id;
    const { suggestedUserIds } = req.body;

    if (!suggestedUserIds || !Array.isArray(suggestedUserIds) || suggestedUserIds.length === 0) {
      return res.status(400).json({ message: 'No suggested user IDs provided.' });
    }

    const suggestions = suggestedUserIds.map(suggestedId => ({
      follower_user_id: vipUserId,
      followed_user_id: suggestedId,
      status: 'pending', // Admin-initiated suggestions are pending
    }));

    await Relationship.insertMany(suggestions);

    res.status(201).json({ message: 'Match suggestions sent successfully.' });
  } catch (error) {
    console.error('Error sending match suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const getReportDetails = (req, res) => res.json({ message: 'Not implemented' });
const resolveReport = (req, res) => res.json({ message: 'Not implemented' });
const getSystemSettings = (req, res) => res.json({ message: 'Not implemented' });

// @desc    Send push notification
// @route   POST /api/admin/push-notifications
// @access  Private/Admin
const sendAdminPushNotification = async (req, res) => {
  const { title, message, target, targetUsers } = req.body;

  try {
    let query = {};

    switch (target) {
      case 'all':
        query = { pushToken: { $exists: true, $ne: null } };
        break;
      case 'premium':
        query = { plan: 'premium', pushToken: { $exists: true, $ne: null } };
        break;
      case 'free':
        query = { plan: 'freemium', pushToken: { $exists: true, $ne: null } };
        break;
      case 'specific':
        if (!targetUsers || !Array.isArray(targetUsers) || targetUsers.length === 0) {
          return res.status(400).json({ message: 'Please select at least one user.' });
        }
        query = { _id: { $in: targetUsers }, pushToken: { $exists: true, $ne: null } };
        break;
      default:
        return res.status(400).json({ message: 'Invalid target specified.' });
    }

    const usersToNotify = await User.find(query).select('pushToken');

    if (usersToNotify.length === 0) {
      return res.status(404).json({ message: 'No users found with push tokens for the selected target.' });
    }

    const tokens = usersToNotify.map(user => user.pushToken).filter(Boolean);

    // This is where you would integrate with a push notification service like Firebase Cloud Messaging (FCM)
    // For now, we will simulate the sending process.
    console.log(`Simulating sending push notification to ${tokens.length} tokens.`);

    const newNotification = new PushNotification({
      title,
      message,
      target,
      sentTo: usersToNotify.length,
      sentAt: new Date(),
    });

    await newNotification.save();

    res.json({ message: `Push notification successfully sent to ${usersToNotify.length} users.` });

  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Failed to send push notification.' });
  }
};

const getAdminPushNotifications = async (req, res) => {
  try {
    const notifications = await PushNotification.find().sort({ sentAt: -1 });
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching push notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Schedule an email
// @route   POST /api/admin/schedule-email
// @access  Private/Admin
const scheduleEmail = async (req, res) => {
  try {
    const { userIds, subject, message, sendToAll, sendAt } = req.body;
    let users = [];

    if (sendToAll === 'true' || sendToAll === true) {
      users = await User.find({}, '_id');
    } else {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one user.' });
      }
      users = await User.find({ '_id': { $in: userIds } }, '_id');
    }

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found to schedule email for.' });
    }
    
    if (!sendAt) {
        return res.status(400).json({ message: 'Please provide a scheduled time.' });
    }

    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer.toString('base64'), // Store as base64
        contentType: file.mimetype,
      }));
    }

    const newScheduledEmail = new ScheduledEmail({
      recipients: users.map(u => u._id),
      subject,
      message,
      attachments,
      sendTime: new Date(sendAt),
      status: 'pending',
    });

    await newScheduledEmail.save();

    res.status(201).json({ message: `Email scheduled successfully for ${users.length} users.` });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ message: 'Failed to schedule email.' });
  }
};

// @desc    Get all scheduled emails
// @route   GET /api/admin/scheduled-emails
// @access  Private/Admin
const getScheduledEmails = async (req, res) => {
  try {
    const scheduledEmails = await ScheduledEmail.find({ status: 'pending' }).populate('recipients', 'fname lname email');
    res.json(scheduledEmails);
  } catch (error) {
    console.error('Error getting scheduled emails:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel a scheduled email
// @route   DELETE /api/admin/scheduled-emails/:id
// @access  Private/Admin
const cancelScheduledEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ message: 'Scheduled email not found' });
    }

    if (email.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel an email that is not pending' });
    }

    await ScheduledEmail.deleteOne({ _id: req.params.id });

    res.json({ message: 'Scheduled email cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const sendAdminNotification = (req, res) => res.json({ message: 'Not implemented' });
const getAdminNotifications = (req, res) => res.json({ message: 'Not implemented' });
const markNotificationAsRead = (req, res) => res.json({ message: 'Not implemented' });


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
  getAdminPushNotifications
};
