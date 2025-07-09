
const mongoose = require('mongoose');

const emailAnalyticsSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'],
    default: 'sent'
  },
  bounceType: {
    type: String,
    enum: ['hard', 'soft', 'permanent', 'temporary']
  },
  bounceReason: String,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  deliveredAt: Date,
  metadata: {
    userAgent: String,
    ipAddress: String,
    clickedLinks: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailAnalytics', emailAnalyticsSchema);
