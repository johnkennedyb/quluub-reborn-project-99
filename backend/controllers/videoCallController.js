
const Call = require('../models/Call');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');

// Initiate a call
const initiateCall = async (req, res) => {
  try {
    const { calleeId, platform = 'jitsi' } = req.body;
    const callerId = req.user.id;

    // Check if callee exists
    const callee = await User.findById(calleeId);
    if (!callee) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique room ID for Jitsi
    const roomId = `quluub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create call record
    const call = new Call({
      caller: callerId,
      callee: calleeId,
      platform: 'jitsi',
      roomId: roomId,
      status: 'initiated',
      startTime: new Date()
    });

    await call.save();

    // Populate caller and callee information
    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'fname lname')
      .populate('callee', 'fname lname');

    // Send notification to callee
    const callerName = `${req.user.fname} ${req.user.lname}`;
    await sendNotification(calleeId, {
      type: 'video_call',
      title: 'Incoming Video Call',
      message: `${callerName} is calling you`,
      data: {
        callId: call._id,
        callerId: callerId,
        callerName: callerName,
        platform: 'jitsi',
        roomId: roomId
      }
    });

    // Emit socket event for real-time notification
    if (global.io) {
      global.io.to(calleeId).emit('incoming-call', {
        callId: call._id,
        callerId: callerId,
        callerName: callerName,
        platform: 'jitsi',
        roomId: roomId
      });
    }

    res.status(201).json({
      success: true,
      call: populatedCall,
      roomId: roomId,
      platform: 'jitsi'
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update call status
const updateCallStatus = async (req, res) => {
  try {
    const { callId, status } = req.body;
    const userId = req.user.id;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is part of this call
    if (call.caller.toString() !== userId && call.callee.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update call status
    const updateData = { status };
    
    if (status === 'accepted') {
      updateData.answeredAt = new Date();
    } else if (status === 'ended') {
      updateData.endTime = new Date();
      if (!call.answeredAt) {
        updateData.answeredAt = new Date(); // In case it wasn't set
      }
    }

    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      updateData,
      { new: true }
    ).populate('caller', 'fname lname').populate('callee', 'fname lname');

    // Notify the other party about status change
    const otherPartyId = call.caller.toString() === userId ? call.callee : call.caller;
    
    if (global.io) {
      global.io.to(otherPartyId.toString()).emit('call-status-update', {
        callId: callId,
        status: status,
        roomId: call.roomId
      });
    }

    res.json({
      success: true,
      call: updatedCall
    });

  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get call by room ID
const getCallByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const call = await Call.findOne({ roomId })
      .populate('caller', 'fname lname')
      .populate('callee', 'fname lname');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is part of this call
    if (call.caller._id.toString() !== userId && call.callee._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      call: call
    });

  } catch (error) {
    console.error('Error getting call by room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  initiateCall,
  updateCallStatus,
  getCallByRoom
};
