
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'inappropriate_content',
      'harassment',
      'fake_profile',
      'spam',
      'underage',
      'offensive_language',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'dismissed', 'action_taken'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  actionTaken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
