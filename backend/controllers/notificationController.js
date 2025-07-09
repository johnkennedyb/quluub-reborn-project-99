const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// @desc    Send a notification to all users
// @route   POST /api/notifications/global
// @access  Private/Admin
exports.sendGlobalNotification = asyncHandler(async (req, res) => {
  const { title, message, userIds } = req.body; // userIds is an array of user IDs

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  let users;
  if (userIds && userIds.length > 0) {
    // Send to specific users
    users = await User.find({ '_id': { $in: userIds } }, '_id');
  } else {
    // Send to all users
    users = await User.find({}, '_id');
  }

  if (users.length === 0) {
    res.status(404);
    throw new Error('No users found to send notification to');
  }

  const notifications = users.map(user => ({
    user: user._id,
    title,
    message,
    read: false,
  }));

  await Notification.insertMany(notifications);

  res.status(201).json({ message: `Notification sent to ${users.length} users.` });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (notification && notification.user.toString() === req.user._id.toString()) {
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});