
const User = require('../models/User');
const UserActivityLog = require('../models/UserActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/users/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    // Only allow updating own profile unless admin
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    const updatableFields = [
      'fname', 'lname', 'parentEmail', 'nationality', 'country', 'state', 'city', 'build', 
      'appearance', 'maritalStatus', 'patternOfSalaah', 
      'genotype', 'summary', 'workEducation', 'hidden',
      'profile_pic', 'kunya', 'dob', 'ethnicity', 'waliDetails', 'hijab', 'beard'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    // Save user
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      fname: updatedUser.fname,
      lname: updatedUser.lname,
      parentEmail: updatedUser.parentEmail,
      plan: updatedUser.plan,
      gender: updatedUser.gender,
      nationality: updatedUser.nationality,
      country: updatedUser.country,
      build: updatedUser.build,
      appearance: updatedUser.appearance,
      maritalStatus: updatedUser.maritalStatus,
      patternOfSalaah: updatedUser.patternOfSalaah,
      genotype: updatedUser.genotype,
      summary: updatedUser.summary,
      workEducation: updatedUser.workEducation,
      hidden: updatedUser.hidden,
      kunya: updatedUser.kunya,
      dob: updatedUser.dob,
      ethnicity: updatedUser.ethnicity,  
      profile_pic: updatedUser.profile_pic,
      waliDetails: updatedUser.waliDetails,
      hijab: updatedUser.hijab,
      beard: updatedUser.beard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get users for browsing (with filtering)
// @route   GET /api/users/browse
// @access  Private
exports.getBrowseUsers = async (req, res) => {
  try {
    console.log("Getting browse users with query:", req.query);
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Default filters - only exclude current user
    const filters = {
      _id: { $ne: req.user._id }, // Exclude current user
    };
    
    // Always filter by opposite gender
    filters.gender = currentUser.gender === 'male' ? 'female' : 'male';
    
    // Additional filters from query
    if (req.query.country) {
      filters.country = req.query.country;
    }
    
    if (req.query.nationality) {
      filters.nationality = req.query.nationality;
    }

    if (req.query.hijab === 'Yes') {
      filters.hijab = 'Yes';
    }

    if (req.query.beard === 'Yes') {
      filters.beard = 'Yes';
    }
    
    if (req.query.build) {
      filters.build = req.query.build;
    }
    
    if (req.query.appearance) {
      filters.appearance = req.query.appearance;
    }
    
    if (req.query.genotype) {
      filters.genotype = req.query.genotype;
    }
    
    console.log("Applying filters:", filters);
    
    // Allow pagination for large datasets
    const limit = req.query.limit ? parseInt(req.query.limit) : 30;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;

    const count = await User.countDocuments(filters);
    
    const users = await User.find(filters)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken')
      .sort({ lastSeen: -1 }) // Most recently active first
      .limit(limit)
      .skip(skip);
    
    console.log(`Found ${users.length} users matching the criteria on page ${page}`);
    
    res.json({
      users,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error("Error in getBrowseUsers:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upgrade user plan
// @route   POST /api/users/upgrade-plan
// @access  Public (called by webhook)
exports.upgradePlan = async (req, res) => {
  try {
    const { email, plan } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.plan = plan || 'premium';
    await user.save();
    
    res.json({ message: 'Plan upgraded successfully' });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add user to favorites
// @route   POST /api/users/favorites/:userId
// @access  Private
exports.addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const favoriteUserId = req.params.userId;
    
    console.log(`Adding user ${favoriteUserId} to favorites for user ${userId}`);
    
    if (userId.toString() === favoriteUserId) {
      return res.status(400).json({ message: "You cannot add yourself to favorites" });
    }
    
    // Check if user exists
    const favoriteUser = await User.findById(favoriteUserId);
    if (!favoriteUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add to favorites if not already there
    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = [];
    }
    
    if (!user.favorites.includes(favoriteUserId)) {
      user.favorites.push(favoriteUserId);
      await user.save();
      console.log(`Successfully added to favorites. New favorites array:`, user.favorites);
    }
    
    res.json({ message: "User added to favorites", favorites: user.favorites });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove user from favorites
// @route   DELETE /api/users/favorites/:userId
// @access  Private
exports.removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const favoriteUserId = req.params.userId;
    
    console.log(`Removing user ${favoriteUserId} from favorites for user ${userId}`);
    
    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = [];
    }
    
    user.favorites = user.favorites.filter(id => id.toString() !== favoriteUserId);
    await user.save();
    
    console.log(`Successfully removed from favorites. New favorites array:`, user.favorites);
    
    res.json({ message: "User removed from favorites", favorites: user.favorites });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's favorites
// @route   GET /api/users/favorites
// @access  Private
// @desc    Get profile views count
// @route   GET /api/users/profile-views-count
// @access  Private
exports.getProfileViewsCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ profileViews: user.profileViews || 0 });
  } catch (error) {
    console.error('Get profile views count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Getting favorites for user ${userId}`);
    
    const user = await User.findById(userId).populate('favorites', '-password');
    
    console.log(`Found ${user.favorites?.length || 0} favorites`);
    
    res.json({ favorites: user.favorites || [] });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Deleting account for user ${userId}`);
    
    // Start a transaction to ensure all related data is deleted
    const session = await User.startSession();
    session.startTransaction();
    
    try {
      // Import required models
      const Relationship = require('../models/Relationship');
      const Chat = require('../models/Chat');
      const Notification = require('../models/Notification');
      const Payment = require('../models/Payment');
      const Subscription = require('../models/Subscription');
      const UserActivityLog = require('../models/UserActivityLog');
      
      // Delete all related data
      await Relationship.deleteMany({ $or: [{ user1: userId }, { user2: userId }] }, { session });
      await Chat.deleteMany({ participants: userId }, { session });
      await Notification.deleteMany({ recipient: userId }, { session });
      await Payment.deleteMany({ user: userId }, { session });
      await Subscription.deleteMany({ user: userId }, { session });
      await UserActivityLog.deleteMany({ user: userId }, { session });
      
      // Finally, delete the user account
      await User.deleteOne({ _id: userId }, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      console.log(`Successfully deleted account for user ${userId}`);
      
      res.json({ message: 'Account and all associated data have been successfully deleted.' });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
