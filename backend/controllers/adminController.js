const User = require('../models/User');
const Call = require('../models/Call');
const crypto = require('crypto');
const mongoose = require('mongoose');

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments();
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const inactiveSixMonths = await User.countDocuments({
      status: 'inactive',
      updatedAt: { $lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
    });
    const premiumMembers = await User.countDocuments({ plan: { $in: ['premium', 'pro'] } });
    const messagesExchanged = 5423; // Mock data
    const messagesThisWeek = 234; // Mock data
    const recentRegistrations = 56; // Mock data
    const conversionRate = 15; // Mock data
    const inactiveQuarter = 123; // Mock data
    const inactiveYear = 45; // Mock data
    const totalMatches = 789; // Mock data
    const successRate = 65; // Mock data
    const avgMatchesPerUser = 3; // Mock data
    const growthRate = 10; // Mock data
    const churnRate = 5; // Mock data
    const engagementRate = 75; // Mock data

    res.json({
      totalMembers,
      inactiveUsers,
      inactiveSixMonths,
      premiumMembers,
      messagesExchanged,
      messagesThisWeek,
      recentRegistrations,
      conversionRate,
      inactiveQuarter,
      inactiveYear,
      totalMatches,
      successRate,
      avgMatchesPerUser,
      growthRate,
      churnRate,
      engagementRate
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;
    const planFilter = req.query.plan;
    const genderFilter = req.query.gender;
    const searchTerm = req.query.searchTerm;

    let query = {};

    if (statusFilter) {
      query.status = statusFilter;
    }

    if (planFilter) {
      query.plan = planFilter;
    }

    if (genderFilter) {
      query.gender = genderFilter;
    }

    if (searchTerm) {
      query.$or = [
        { fname: { $regex: searchTerm, $options: 'i' } },
        { lname: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken -validationTokenExpiration');

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      page,
      limit,
      totalUsers,
      totalPages,
      users
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken -validationTokenExpiration');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private/Admin
exports.updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ message: 'Plan is required' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User plan updated successfully', user });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { fname, lname, username, email, gender, dob, country, city, state, occupation, about, religion, sect, maritalStatus, children, education, ethnicity, height, complexion, bodyType, smoking, drinking, diet, lookingFor } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, {
      fname,
      lname,
      username,
      email,
      gender,
      dob,
      country,
      city,
      state,
      occupation,
      about,
      religion,
      sect,
      maritalStatus,
      children,
      education,
      ethnicity,
      height,
      complexion,
      bodyType,
      smoking,
      drinking,
      diet,
      lookingFor
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new random password
    const newPassword = crypto.randomBytes(16).toString('hex');

    // Set the new password and save the user
    user.password = newPassword;
    await user.save();

    res.json({ message: 'User password reset successfully', newPassword });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get system metrics
// @route   GET /api/admin/system
// @access  Private/Admin
exports.getSystemMetrics = async (req, res) => {
  try {
    // Mock system metrics - in a real app, you'd gather these from the system
    const metrics = {
      cpuUsage: 65,
      memoryUsage: 70,
      diskUsage: 80,
      networkTraffic: 120
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all calls
// @route   GET /api/admin/calls
// @access  Private/Admin
exports.getAllCalls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const calls = await Call.find()
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 })
      .populate('callerId', 'fname lname')
      .populate('receiverId', 'fname lname');

    const totalCalls = await Call.countDocuments();
    const totalPages = Math.ceil(totalCalls / limit);

    res.json({
      page,
      limit,
      totalCalls,
      totalPages,
      calls
    });
  } catch (error) {
    console.error('Error getting all calls:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save call record
// @route   POST /api/admin/calls
// @access  Private/Admin
exports.saveCallRecord = async (req, res) => {
  try {
    const { callerId, receiverId, startTime, endTime, duration, recordingUrl } = req.body;

    const call = new Call({
      callerId,
      receiverId,
      startTime,
      endTime,
      duration,
      recordingUrl
    });

    await call.save();

    res.status(201).json({ message: 'Call record saved successfully', call });
  } catch (error) {
    console.error('Error saving call record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload call recording
// @route   POST /api/admin/call-recordings
// @access  Private/Admin
exports.uploadCallRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No recording file uploaded' });
    }

    const { filename, path } = req.file;
    const { conversationId, duration } = req.body;

    // Find the call record by conversationId (assuming it's stored there)
    const call = await Call.findById(conversationId);

    if (!call) {
      return res.status(404).json({ message: 'Call record not found' });
    }

    // Update the call record with the recording URL and duration
    call.recordingUrl = path;
    call.duration = duration || call.duration;
    await call.save();

    res.json({ message: 'Call recording uploaded successfully', recordingUrl: path });
  } catch (error) {
    console.error('Error uploading call recording:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get chat reports
// @route   GET /api/admin/chat-reports
// @access  Private/Admin
exports.getChatReports = async (req, res) => {
  try {
    // Mock chat reports - in a real app, you'd query the database
    const reports = [
      {
        userId1: '60d0fe4f53112361683ca980',
        userId2: '60d0fe4f53112361683ca981',
        messages: 12,
        lastMessage: 'Hello!',
        reported: false
      },
      {
        userId1: '60d0fe4f53112361683ca982',
        userId2: '60d0fe4f53112361683ca983',
        messages: 34,
        lastMessage: 'How are you?',
        reported: true
      }
    ];

    res.json(reports);
  } catch (error) {
    console.error('Error getting chat reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send chat report
// @route   POST /api/admin/send-chat-report
// @access  Private/Admin
exports.sendChatReport = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    // Mock sending chat report - in a real app, you'd send an email
    console.log(`Sending chat report for users ${userId1} and ${userId2}`);

    res.json({ message: 'Chat report sent successfully' });
  } catch (error) {
    console.error('Error sending chat report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reported profiles
// @route   GET /api/admin/reported-profiles
// @access  Private/Admin
exports.getReportedProfiles = async (req, res) => {
  try {
    // Mock reported profiles - in a real app, you'd query the database
    const profiles = [
      {
        _id: '60d0fe4f53112361683ca980',
        fname: 'John',
        lname: 'Doe',
        reports: 3
      },
      {
        _id: '60d0fe4f53112361683ca981',
        fname: 'Jane',
        lname: 'Smith',
        reports: 5
      }
    ];

    res.json(profiles);
  } catch (error) {
    console.error('Error getting reported profiles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Dismiss report
// @route   PATCH /api/admin/reported-profiles/:id/dismiss
// @access  Private/Admin
exports.dismissReport = async (req, res) => {
  try {
    const profileId = req.params.id;

    // Mock dismissing report - in a real app, you'd update the database
    console.log(`Dismissing report for profile ${profileId}`);

    res.json({ message: 'Report dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get VIP users
// @route   GET /api/admin/vip-users
// @access  Private/Admin
exports.getVipUsers = async (req, res) => {
  try {
    // Mock VIP users - in a real app, you'd query the database
    const users = [
      {
        _id: '60d0fe4f53112361683ca980',
        fname: 'John',
        lname: 'Doe',
        email: 'john.doe@example.com'
      },
      {
        _id: '60d0fe4f53112361683ca981',
        fname: 'Jane',
        lname: 'Smith',
        email: 'jane.smith@example.com'
      }
    ];

    res.json(users);
  } catch (error) {
    console.error('Error getting VIP users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get potential matches for a user
// @route   GET /api/admin/users/:id/potential-matches
// @access  Private/Admin
exports.getPotentialMatches = async (req, res) => {
  try {
    const userId = req.params.id;

    // Mock potential matches - in a real app, you'd use a matching algorithm
    const matches = [
      {
        _id: '60d0fe4f53112361683ca982',
        fname: 'Alice',
        lname: 'Johnson',
        email: 'alice.johnson@example.com'
      },
      {
        _id: '60d0fe4f53112361683ca983',
        fname: 'Bob',
        lname: 'Williams',
        email: 'bob.williams@example.com'
      }
    ];

    res.json(matches);
  } catch (error) {
    console.error('Error getting potential matches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send match suggestions to a user
// @route   POST /api/admin/users/:id/suggest-matches
// @access  Private/Admin
exports.sendMatchSuggestions = async (req, res) => {
  try {
    const userId = req.params.id;
    const { matchIds } = req.body;

    // Mock sending match suggestions - in a real app, you'd send an email
    console.log(`Sending match suggestions ${matchIds} to user ${userId}`);

    res.json({ message: 'Match suggestions sent successfully' });
  } catch (error) {
    console.error('Error sending match suggestions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get matching insights
// @route   GET /api/admin/matching-insights
// @access  Private/Admin
exports.getMatchingInsights = async (req, res) => {
  try {
    // Mock matching insights - in a real app, you'd analyze match data
    const insights = {
      mostCommonInterests: ['Reading', 'Hiking', 'Cooking'],
      averageAgeDifference: 3,
      genderRatio: '45% Male, 55% Female'
    };

    res.json(insights);
  } catch (error) {
    console.error('Error getting matching insights:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get engagement metrics
// @route   GET /api/admin/engagement-metrics
// @access  Private/Admin
exports.getEngagementMetrics = async (req, res) => {
  try {
    // Mock engagement metrics - in a real app, you'd analyze user activity
    const metrics = {
      activeUsers: 1234,
      dailyLogins: 567,
      averageSessionDuration: 25,
      messagesSent: 5423
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get conversion metrics
// @route   GET /api/admin/conversion-metrics
// @access  Private/Admin
exports.getConversionMetrics = async (req, res) => {
  try {
    // Mock conversion metrics - in a real app, you'd track user upgrades
    const metrics = {
      freeToPremium: 123,
      premiumToPro: 45,
      totalRevenue: 12345
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting conversion metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get churn analysis
// @route   GET /api/admin/churn-analysis
// @access  Private/Admin
exports.getChurnAnalysis = async (req, res) => {
  try {
    // Mock churn analysis - in a real app, you'd analyze user attrition
    const analysis = {
      churnRate: 5,
      topReasons: ['Lack of matches', 'High price', 'Technical issues']
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error getting churn analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get referral analysis
// @route   GET /api/admin/referral-analysis
// @access  Private/Admin
exports.getReferralAnalysis = async (req, res) => {
  try {
    // Mock referral analysis - in a real app, you'd track user referrals
    const analysis = {
      referralsSent: 456,
      referralsAccepted: 123,
      conversionRate: 25
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error getting referral analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save email configuration
// @route   POST /api/admin/email-config
// @access  Private/Admin
exports.saveEmailConfig = async (req, res) => {
  try {
    const { 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPassword, 
      fromName, 
      fromEmail, 
      replyTo 
    } = req.body;

    console.log('Saving email configuration:', { smtpHost, smtpPort, smtpUser, fromEmail });

    // Here you would typically save to a settings collection in the database
    // For now, we'll use environment variables approach
    
    // Update the email service configuration
    const { updateEmailConfig } = require('../utils/emailService');
    const success = await updateEmailConfig({
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      smtpPassword,
      fromName,
      fromEmail,
      replyTo
    });

    if (!success) {
      return res.status(500).json({ 
        message: 'Failed to update email configuration' 
      });
    }

    res.json({ 
      message: 'Email configuration saved successfully',
      config: {
        smtpHost,
        smtpPort,
        smtpUser,
        fromName,
        fromEmail,
        replyTo
      }
    });

  } catch (error) {
    console.error('Error saving email configuration:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get email configuration
// @route   GET /api/admin/email-config
// @access  Private/Admin
exports.getEmailConfig = async (req, res) => {
  try {
    // Return current email configuration (without password for security)
    const config = {
      smtpHost: process.env.SMTP_HOST || 'mail.quluub.com',
      smtpPort: process.env.SMTP_PORT || '465',
      smtpUser: process.env.MAIL_USER || 'mail@quluub.com',
      fromName: process.env.FROM_NAME || 'Quluub Team',
      fromEmail: process.env.FROM_EMAIL || 'mail@quluub.com',
      replyTo: process.env.REPLY_TO || 'support@quluub.com'
    };

    res.json(config);

  } catch (error) {
    console.error('Error getting email configuration:', error);
    res.status(500).json({ 
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
    const { recipientType, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ 
        message: 'Subject and message are required' 
      });
    }

    console.log('Sending bulk email:', { recipientType, subject });

    // Get users based on recipient type
    let users = [];
    const User = require('../models/User');

    switch (recipientType) {
      case 'all':
        users = await User.find({ status: 'active' }).select('email fname lname');
        break;
      case 'premium':
        users = await User.find({ 
          status: 'active', 
          plan: { $in: ['premium', 'pro'] } 
        }).select('email fname lname');
        break;
      case 'free':
        users = await User.find({ 
          status: 'active', 
          plan: 'free' 
        }).select('email fname lname');
        break;
      case 'inactive':
        users = await User.find({ 
          status: 'inactive' 
        }).select('email fname lname');
        break;
      default:
        users = await User.find({ status: 'active' }).select('email fname lname');
    }

    // Send bulk email using the email service
    const { sendBulkEmail } = require('../utils/emailService');
    const result = await sendBulkEmail(users, subject, message);

    console.log('Bulk email sent:', result);

    res.json({
      message: 'Bulk email sent successfully',
      sentCount: result.successCount,
      failedCount: result.failedCount,
      totalRecipients: users.length
    });

  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Send test email
// @route   POST /api/admin/test-email
// @access  Private/Admin
exports.sendTestEmail = async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ 
        message: 'Test email address is required' 
      });
    }

    console.log('Sending test email to:', testEmail);

    const { sendTestEmail } = require('../utils/emailService');
    const success = await sendTestEmail(testEmail);

    if (!success) {
      return res.status(500).json({ 
        message: 'Failed to send test email' 
      });
    }

    res.json({ 
      message: 'Test email sent successfully',
      recipient: testEmail
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
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
    // Mock email metrics - in a real app, you'd track these in the database
    const metrics = {
      deliveryRate: 98.5,
      openRate: 24.3,
      sentToday: 1247,
      bounced: 3,
      totalSent: 45670,
      totalBounced: 234
    };

    res.json(metrics);

  } catch (error) {
    console.error('Error getting email metrics:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
