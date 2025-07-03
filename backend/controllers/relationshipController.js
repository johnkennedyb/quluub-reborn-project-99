
const { v4: uuidv4 } = require('uuid');
const Relationship = require('../models/Relationship');
const User = require('../models/User');
const UserActivityLog = require('../models/UserActivityLog');

// @desc    Send a follow request
// @route   POST /api/relationships/request
// @access  Private
exports.sendRequest = async (req, res) => {
  try {
    const { followedUserId } = req.body;
    const followerUserId = req.user._id.toString();
    
    console.log(`Sending request: follower=${followerUserId}, followed=${followedUserId}`);
    
    // Check if user is trying to follow themselves
    if (followerUserId === followedUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    
    // Check if followed user exists
    const followedUser = await User.findById(followedUserId);
    if (!followedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if relationship already exists
    const existingRelationship = await Relationship.findOne({
      follower_user_id: followerUserId,
      followed_user_id: followedUserId,
    });
    
    if (existingRelationship) {
      return res.status(400).json({ 
        message: `You have already ${existingRelationship.status === 'pending' ? 'sent a request to' : existingRelationship.status === 'matched' ? 'matched with' : 'been rejected by'} this user` 
      });
    }
    
    // Create relationship
    const relationship = new Relationship({
      id: uuidv4(),
      follower_user_id: followerUserId,
      followed_user_id: followedUserId,
      status: "pending",
    });
    
    await relationship.save();
    console.log("Relationship created:", relationship);
    
    // Log the activity
    await UserActivityLog.create({
      userId: followerUserId,
      receiverId: followedUserId,
      action: "FOLLOWED",
    });
    
    res.status(201).json(relationship);
  } catch (error) {
    console.error("Send request error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Respond to a follow request (accept or reject)
// @route   PUT /api/relationships/:id/status
// @access  Private
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const relationshipId = req.params.id;
    
    console.log(`Responding to request: relationship=${relationshipId}, status=${status}`);
    
    if (!['rejected', 'matched'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'rejected' or 'matched'" });
    }
    
    // Find relationship
    const relationship = await Relationship.findOne({ id: relationshipId });
    
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    // Check if user is the one being followed (only they can respond)
    if (relationship.followed_user_id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this relationship" });
    }
    
    // Check if relationship is in pending state
    if (relationship.status !== 'pending') {
      return res.status(400).json({ message: `Cannot update relationship that is already ${relationship.status}` });
    }
    
    // Update status
    relationship.status = status;
    await relationship.save();
    console.log("Relationship updated:", relationship);
    
    // Log the activity
    await UserActivityLog.create({
      userId: req.user._id.toString(),
      receiverId: relationship.follower_user_id,
      action: status === 'matched' ? "FOLLOWED" : "REJECTED",
    });
    
    res.json(relationship);
  } catch (error) {
    console.error("Respond to request error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Withdraw a follow request
// @route   DELETE /api/relationships/withdraw/:id
// @access  Private
exports.withdrawRequest = async (req, res) => {
  try {
    const relationshipId = req.params.id;
    
    console.log(`Withdrawing request: relationship=${relationshipId}`);
    
    // Find relationship
    const relationship = await Relationship.findOne({ id: relationshipId });
    
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    
    // Check if user is the follower (only they can withdraw)
    if (relationship.follower_user_id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to withdraw this relationship" });
    }
    
    // Check if relationship is in pending state
    if (relationship.status !== 'pending') {
      return res.status(400).json({ message: `Cannot withdraw relationship that is already ${relationship.status}` });
    }
    
    // Delete relationship
    await Relationship.deleteOne({ id: relationshipId });
    console.log("Relationship deleted");
    
    // Log the activity
    await UserActivityLog.create({
      userId: req.user._id.toString(),
      receiverId: relationship.followed_user_id,
      action: "WITHDREW",
    });
    
    res.json({ message: "Request withdrawn successfully" });
  } catch (error) {
    console.error("Withdraw request error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all matches for a user
// @route   GET /api/relationships/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log(`Getting matches for user: ${userId}`);
    
    // Find all matched relationships where user is follower or followed
    const relationships = await Relationship.find({
      $or: [
        { follower_user_id: userId },
        { followed_user_id: userId }
      ],
      status: 'matched'
    });
    
    console.log(`Found ${relationships.length} match relationships`);
    
    // Get array of matched user IDs
    const matchedUserIds = relationships.map(rel => {
      return rel.follower_user_id === userId ? rel.followed_user_id : rel.follower_user_id;
    });
    
    // Get user details for matches
    const matches = await User.find({
      _id: { $in: matchedUserIds }
    }).select('-password');
    
    console.log(`Found ${matches.length} matched users`);
    
    res.json({
      count: matches.length,
      matches: matches.map(match => ({
        ...match._doc,
        relationship: relationships.find(rel => 
          rel.follower_user_id === match._id.toString() || rel.followed_user_id === match._id.toString()
        )
      }))
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get pending connection requests for a user
// @route   GET /api/relationships/pending
// @access  Private
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log(`Getting pending requests for user: ${userId}`);
    
    // Find all pending relationships where user is being followed
    const relationships = await Relationship.find({
      followed_user_id: userId,
      status: 'pending'
    });
    
    console.log(`Found ${relationships.length} pending relationship requests`);
    
    // Get array of follower user IDs
    const followerUserIds = relationships.map(rel => rel.follower_user_id);
    
    // Get user details for followers
    const requestUsers = await User.find({
      _id: { $in: followerUserIds }
    }).select('-password');
    
    console.log(`Found ${requestUsers.length} requesting users`);
    
    res.json({
      count: requestUsers.length,
      requests: requestUsers.map(user => ({
        ...user._doc,
        relationship: relationships.find(rel => rel.follower_user_id === user._id.toString())
      }))
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
