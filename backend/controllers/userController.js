const User = require('../models/User');
const UserActivityLog = require('../models/UserActivityLog');
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');
const LRUCache = require('lru-cache');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Simple in-memory cache for profile data
const profileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to clear profile cache
const clearProfileCache = (userId) => {
  const keys = Array.from(profileCache.keys());
  keys.forEach(key => {
    if (key.startsWith(`profile_${userId}_`)) {
      profileCache.delete(key);
    }
  });
};

// Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of profileCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => profileCache.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 Cleaned up ${keysToDelete.length} expired profile cache entries`);
  }
}, CACHE_TTL); // Run cleanup every 5 minutes

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const isOwnProfile = userId === req.user._id.toString();
    const cacheKey = `profile_${userId}_${isOwnProfile ? 'own' : 'public'}`;
    
    // Check cache first (skip cache for own profile to ensure fresh data)
    if (!isOwnProfile && profileCache.has(cacheKey)) {
      const cached = profileCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        res.set({
          'Cache-Control': 'private, max-age=600',
          'X-Cache': 'HIT'
        });
        return res.json(cached.data);
      } else {
        profileCache.delete(cacheKey);
      }
    }
    
    // Optimize field selection based on profile type
    let selectFields = '-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken';
    
    // For viewing others' profiles, exclude sensitive fields
    if (!isOwnProfile) {
      selectFields += ' -email -phoneNumber -parentEmail -waliDetails -favorites -blockedUsers -reportedUsers';
    }
    
    // Determine if userId is a valid ObjectId or a username
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      // It's a valid ObjectId, search by _id
      user = await User.findById(userId)
        .select(selectFields)
        .lean();
    } else {
      // It's likely a username, search by username
      user = await User.findOne({ username: userId })
        .select(selectFields)
        .lean();
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cache public profiles only
    if (!isOwnProfile) {
      profileCache.set(cacheKey, {
        data: user,
        timestamp: Date.now()
      });
    }

    // Set cache headers for better performance
    res.set({
      'Cache-Control': isOwnProfile ? 'private, max-age=300' : 'private, max-age=600',
      'ETag': `"${user._id}-${user.updatedAt || user.createdAt}"`,
      'X-Cache': 'MISS'
    });

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
    
    // Update fields - COMPREHENSIVE LIST including all ProfileEditSections fields
    const updatableFields = [
      // Basic Info
      'fname', 'lname', 'kunya', 'dob', 'maritalStatus', 'noOfChildren', 
      'summary', 'workEducation', 'parentEmail', 'profile_pic', 'hidden',
      
      // Location and Ethnicity
      'nationality', 'country', 'state', 'city', 'region', 'ethnicity',
      
      // Appearance and Physical
      'height', 'weight', 'build', 'appearance', 'hijab', 'beard', 'genotype',
      
      // Islamic Practice and Deen
      'patternOfSalaah', 'revert', 'startedPracticing', 'sect', 
      'scholarsSpeakers', 'dressingCovering', 'islamicPractice',
      
      // Lifestyle and Matching
      'traits', 'interests', 'openToMatches', 'dealbreakers', 'icebreakers',
      
      // Wali Details (for female users)
      'waliDetails'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    // Save user
    const updatedUser = await user.save();
    
    // Clear profile cache for this user to ensure fresh data
    clearProfileCache(req.params.id);
    
    // Return comprehensive user data including all updated fields
    res.json({
      _id: updatedUser._id,
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      
      // Basic Info
      fname: updatedUser.fname,
      lname: updatedUser.lname,
      kunya: updatedUser.kunya,
      dob: updatedUser.dob,
      maritalStatus: updatedUser.maritalStatus,
      noOfChildren: updatedUser.noOfChildren,
      summary: updatedUser.summary,
      workEducation: updatedUser.workEducation,
      parentEmail: updatedUser.parentEmail,
      profile_pic: updatedUser.profile_pic,
      hidden: updatedUser.hidden,
      
      // System fields
      plan: updatedUser.plan,
      gender: updatedUser.gender,
      
      // Location and Ethnicity
      nationality: updatedUser.nationality,
      country: updatedUser.country,
      state: updatedUser.state,
      city: updatedUser.city,
      region: updatedUser.region,
      ethnicity: updatedUser.ethnicity,
      
      // Appearance and Physical
      height: updatedUser.height,
      weight: updatedUser.weight,
      build: updatedUser.build,
      appearance: updatedUser.appearance,
      hijab: updatedUser.hijab,
      beard: updatedUser.beard,
      genotype: updatedUser.genotype,
      
      // Islamic Practice and Deen
      patternOfSalaah: updatedUser.patternOfSalaah,
      revert: updatedUser.revert,
      startedPracticing: updatedUser.startedPracticing,
      sect: updatedUser.sect,
      scholarsSpeakers: updatedUser.scholarsSpeakers,
      dressingCovering: updatedUser.dressingCovering,
      islamicPractice: updatedUser.islamicPractice,
      
      // Lifestyle and Matching
      traits: updatedUser.traits,
      interests: updatedUser.interests,
      openToMatches: updatedUser.openToMatches,
      dealbreakers: updatedUser.dealbreakers,
      icebreakers: updatedUser.icebreakers,
      
      // Wali Details (for female users)
      waliDetails: updatedUser.waliDetails,
      
      // Timestamps
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
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

// @desc    Search users with advanced filtering (taofeeq_UI compatible)
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const {
      nationality,
      country,
      ageRange,
      heightRange,
      weightRange,
      build,
      appearance,
      maritalStatus,
      patternOfSalaah,
      genotype,
      sortBy = 'lastSeen',
      page = 1,
      limit = 20
    } = req.query;

    const currentUser = req.user;
    
    // Get existing relationships to exclude from search
    const Relationship = require('../models/Relationship');
    const existingRelationships = await Relationship.find({
      $or: [
        { requester: currentUser._id },
        { recipient: currentUser._id }
      ],
      status: { $in: ['pending', 'accepted'] }
    }).select('requester recipient');
    
    // Extract user IDs to exclude (existing matches/pending requests)
    const excludeUserIds = existingRelationships.map(rel => 
      rel.requester.toString() === currentUser._id.toString() 
        ? rel.recipient 
        : rel.requester
    );
    
    const query = {
      _id: { 
        $ne: currentUser._id,
        $nin: excludeUserIds // Exclude existing matches and pending requests
      },
      emailVerified: true,
      hidden: { $ne: true }
    };

    // Gender filtering - show opposite gender
    if (currentUser.gender) {
      query.gender = currentUser.gender === 'male' ? 'female' : 'male';
    }

    // Apply filters
    if (nationality && nationality !== '') {
      query.nationality = new RegExp(nationality, 'i');
    }

    if (country && country !== '') {
      query.country = new RegExp(country, 'i');
    }

    if (build && build !== '') {
      query.build = new RegExp(build, 'i');
    }

    if (appearance && appearance !== '') {
      query.appearance = new RegExp(appearance, 'i');
    }

    if (maritalStatus && maritalStatus !== '') {
      query.maritalStatus = new RegExp(maritalStatus, 'i');
    }

    if (patternOfSalaah && patternOfSalaah !== '') {
      query.patternOfSalaah = new RegExp(patternOfSalaah, 'i');
    }

    if (genotype && genotype !== '') {
      query.genotype = new RegExp(genotype, 'i');
    }

    // Age range filtering
    if (ageRange && Array.isArray(ageRange) && ageRange.length === 2) {
      const [minAge, maxAge] = ageRange.map(Number);
      const maxDate = new Date();
      const minDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - minAge);
      minDate.setFullYear(minDate.getFullYear() - maxAge);
      
      query.dob = {
        $gte: minDate,
        $lte: maxDate
      };
    }

    // Height range filtering (assuming height is stored in inches)
    if (heightRange && Array.isArray(heightRange) && heightRange.length === 2) {
      const [minHeight, maxHeight] = heightRange.map(Number);
      query.height = {
        $gte: minHeight,
        $lte: maxHeight
      };
    }

    // Weight range filtering
    if (weightRange && Array.isArray(weightRange) && weightRange.length === 2) {
      const [minWeight, maxWeight] = weightRange.map(Number);
      query.weight = {
        $gte: minWeight,
        $lte: maxWeight
      };
    }

    // Sorting
    let sortOptions = {};
    switch (sortBy) {
      case 'lastSeen':
        sortOptions = { lastSeen: -1, createdAt: -1 };
        break;
      case 'created':
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { lastSeen: -1, createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordTokenExpiration -validationToken -email -phoneNumber -parentEmail -waliDetails -favorites -blockedUsers -reportedUsers')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Update last seen for current user
    await User.findByIdAndUpdate(currentUser._id, { lastSeen: new Date() });

    res.json({
      returnData: users,
      currentPage: pageNum,
      totalPages,
      totalUsers,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Log profile view
// @route   POST /api/users/log-profile-view
// @access  Private
exports.logProfileView = async (req, res) => {
  try {
    const { userId } = req.body;
    const viewerId = req.user._id.toString();
    
    // Don't log if user is viewing their own profile
    if (userId === viewerId) {
      return res.status(200).json({ message: 'Own profile view not logged' });
    }
    
    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log the profile view activity
    await UserActivityLog.create({
      userId: viewerId,
      receiverId: userId,
      action: 'PROFILE_VIEW',
    });
    
    res.status(200).json({ message: 'Profile view logged successfully' });
  } catch (error) {
    console.error('Log profile view error:', error);
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
