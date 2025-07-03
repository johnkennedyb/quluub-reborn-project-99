
const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }],
  status: { 
    type: String, 
    enum: ['started', 'ongoing', 'ended', 'failed'],
    default: 'started'
  },
  duration: { type: Number, default: 0 }, // in seconds
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  recordingUrl: { type: String },
  quality: { type: String, enum: ['good', 'fair', 'poor'], default: 'good' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Call', callSchema);
