const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @desc    Get all subscriptions
// @route   GET /api/admin/subscriptions
// @access  Private (Admin only)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).populate('user', 'username fname lname');

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
