
const User = require('../models/User');
const Relationship = require('../models/Relationship');
const Chat = require('../models/Chat');
const { sendEmail: sendEmailService } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments();
    const maleMembers = await User.countDocuments({ gender: 'male' });
    const femaleMembers = await User.countDocuments({ gender: 'female' });
    const premiumMembers = await User.countDocuments({ plan: 'premium' });
    const hiddenProfiles = await User.countDocuments({ hidden: true });
    
    // Calculate inactive users
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const inactiveUsers = await User.countDocuments({ lastSeen: { $lt: oneMonthAgo } });
    const inactiveQuarter = await User.countDocuments({ lastSeen: { $lt: threeMonthsAgo } });
    const inactiveSixMonths = await User.countDocuments({ lastSeen: { $lt: sixMonthsAgo } });
    const inactiveYear = await User.countDocuments({ lastSeen: { $lt: oneYearAgo } });
    
    // Calculate relationship stats
    const totalMatches = await Relationship.countDocuments({ status: 'accepted' });
    const totalRejections = await Relationship.countDocuments({ status: 'rejected' });
    const successRate = totalMatches + totalRejections > 0 ? 
      Math.round((totalMatches / (totalMatches + totalRejections)) * 100) : 0;
    
    // Calculate messages exchanged
    const messagesExchanged = await Chat.countDocuments();
    
    // Calculate recent registrations (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    // Calculate conversion rate
    const conversionRate = totalMembers > 0 ? 
      Math.round((premiumMembers / totalMembers) * 100) : 0;
    
    // Calculate average matches per user
    const avgMatchesPerUser = totalMembers > 0 ? 
      Math.round(totalMatches / totalMembers * 10) / 10 : 0;
    
    // Calculate growth and churn rates (simplified)
    const growthRate = Math.round((recentRegistrations / 7) * 30); // Approximate monthly growth
    const churnRate = totalMembers > 0 ? 
      Math.round((inactiveUsers / totalMembers) * 100) : 0;
    
    // Calculate engagement rate (users active in last month)
    const activeUsers = await User.countDocuments({ 
      lastSeen: { $gte: oneMonthAgo } 
    });
    const engagementRate = totalMembers > 0 ? 
      Math.round((activeUsers / totalMembers) * 100) : 0;

    res.json({
      totalMembers,
      maleMembers,
      femaleMembers,
      premiumMembers,
      hiddenProfiles,
      inactiveUsers,
      inactiveQuarter,
      inactiveSixMonths,
      inactiveYear,
      totalMatches,
      successRate,
      messagesExchanged,
      recentRegistrations,
      conversionRate,
      avgMatchesPerUser,
      growthRate,
      churnRate,
      engagementRate
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with filtering and pagination
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      gender = 'all',
      plan = 'all',
      status = 'all',
      country = '',
      city = '',
      inactiveFor = 'all'
    } = req.query;

    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Gender filter
    if (gender !== 'all') {
      filter.gender = gender;
    }
    
    // Plan filter
    if (plan !== 'all') {
      if (plan === 'free') {
        filter.plan = 'freemium';
      } else {
        filter.plan = plan;
      }
    }
    
    // Status filter
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Country filter
    if (country) {
      const countries = country.split(',').filter(c => c.trim());
      if (countries.length > 0) {
        filter.country = { $in: countries };
      }
    }
    
    // City filter
    if (city) {
      const cities = city.split(',').filter(c => c.trim());
      if (cities.length > 0) {
        filter.city = { $in: cities };
      }
    }
    
    // Inactive filter
    if (inactiveFor !== 'all') {
      const days = parseInt(inactiveFor);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filter.lastSeen = { $lt: cutoffDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add computed fields
    const usersWithExtra = users.map(user => {
      const userObj = user.toObject();
      
      // Calculate age if DOB exists
      if (userObj.dob) {
        const today = new Date();
        const birthDate = new Date(userObj.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        userObj.age = age;
      }
      
      // Calculate days since last seen
      if (userObj.lastSeen) {
        const lastSeenDate = new Date(userObj.lastSeen);
        const today = new Date();
        const diffTime = Math.abs(today - lastSeenDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        userObj.lastSeenAgo = diffDays;
      } else {
        userObj.lastSeenAgo = null;
      }
      
      // Add placeholder counts (you can implement actual counts from relationships/chats)
      userObj.matchCount = 0;
      userObj.messageCount = 0;
      
      return userObj;
    });

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      users: usersWithExtra,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user and related data
    await User.findByIdAndDelete(id);
    await Relationship.deleteMany({
      $or: [{ requester: id }, { addressee: id }]
    });
    await Chat.deleteMany({
      $or: [{ sender: id }, { receiver: id }]
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;
    
    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send password reset
const sendPasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Update user password
    await User.findByIdAndUpdate(id, { password: hashedPassword });
    
    // Send email with temporary password
    try {
      await sendEmailService(
        user.email,
        'Password Reset - Temporary Password',
        `Your temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately.`
      );
      
      res.json({ message: 'Password reset email sent successfully' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(500).json({ message: 'Password reset but failed to send email' });
    }
  } catch (error) {
    console.error('Error sending password reset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send email to user
const sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await sendEmailService(user.email, subject, message);
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  updateUser,
  sendPasswordReset,
  sendEmail
};
