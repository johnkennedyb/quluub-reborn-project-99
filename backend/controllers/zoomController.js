const axios = require('axios');
const User = require('../models/User');

// Zoom API configuration (Server-to-Server OAuth)
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

// Cache for access token
let accessTokenCache = {
  token: null,
  expiresAt: null
};

// Get Zoom OAuth access token
const getZoomAccessToken = async () => {
  // Check if we have a valid cached token
  if (accessTokenCache.token && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  try {
    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post('https://zoom.us/oauth/token', 
      `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = response.data;
    
    // Cache the token
    accessTokenCache = {
      token: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - 60000 // Subtract 1 minute for safety
    };

    return access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Zoom API');
  }
};

// @desc    Create a new Zoom meeting
// @route   POST /api/zoom/create-meeting
// @access  Private (Premium users only)
exports.createMeeting = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user is premium
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.plan !== 'premium' && user.plan !== 'pro') {
      return res.status(403).json({ 
        message: 'Video calls are available for Premium users only. Upgrade your plan to access this feature.',
        requiresUpgrade: true 
      });
    }
    
    const {
      topic = 'Quluub Video Call',
      duration = 60,
      start_time,
      password,
      waiting_room = true,
      join_before_host = false
    } = req.body;
    
    const accessToken = await getZoomAccessToken();
    
    const meetingData = {
      topic,
      type: 2, // Scheduled meeting
      duration,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 2,
        audio: 'both',
        auto_recording: 'none',
        waiting_room
      }
    };
    
    if (start_time) {
      meetingData.start_time = start_time;
    }
    
    if (password) {
      meetingData.password = password;
    }
    
    console.log('Creating Zoom meeting with data:', meetingData);
    
    const response = await axios.post(
      `${ZOOM_API_BASE_URL}/users/me/meetings`,
      meetingData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const meeting = response.data;
    
    console.log('Zoom meeting created successfully:', meeting.id);
    
    res.json({
      id: meeting.id,
      topic: meeting.topic,
      start_url: meeting.start_url,
      join_url: meeting.join_url,
      password: meeting.password,
      start_time: meeting.start_time,
      duration: meeting.duration,
      meeting_id: meeting.id
    });
    
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        message: 'Zoom API authentication failed. Please contact support.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create video call meeting',
      error: error.response?.data?.message || error.message 
    });
  }
};

// @desc    Get meeting details
// @route   GET /api/zoom/meeting/:meetingId
// @access  Private (Premium users only)
exports.getMeeting = async (req, res) => {
  try {
    const userId = req.user._id;
    const { meetingId } = req.params;
    
    // Check if user is premium
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.plan !== 'premium' && user.plan !== 'pro') {
      return res.status(403).json({ 
        message: 'Video calls are available for Premium users only.',
        requiresUpgrade: true 
      });
    }
    
    const accessToken = await getZoomAccessToken();
    
    const response = await axios.get(
      `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const meeting = response.data;
    
    res.json({
      id: meeting.id,
      topic: meeting.topic,
      start_url: meeting.start_url,
      join_url: meeting.join_url,
      password: meeting.password,
      start_time: meeting.start_time,
      duration: meeting.duration,
      status: meeting.status
    });
    
  } catch (error) {
    console.error('Error getting Zoom meeting:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to get meeting details',
      error: error.response?.data?.message || error.message 
    });
  }
};

// @desc    Delete a meeting
// @route   DELETE /api/zoom/meeting/:meetingId
// @access  Private (Premium users only)
exports.deleteMeeting = async (req, res) => {
  try {
    const userId = req.user._id;
    const { meetingId } = req.params;
    
    // Check if user is premium
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.plan !== 'premium' && user.plan !== 'pro') {
      return res.status(403).json({ 
        message: 'Video calls are available for Premium users only.',
        requiresUpgrade: true 
      });
    }
    
    const token = generateZoomToken();
    
    await axios.delete(
      `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Zoom meeting deleted successfully:', meetingId);
    
    res.json({ message: 'Meeting deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to delete meeting',
      error: error.response?.data?.message || error.message 
    });
  }
};

// Functions are already exported using exports.functionName above
// No need for module.exports since we're using exports.functionName syntax
