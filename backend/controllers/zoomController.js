const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

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
  console.log('🔐 Getting Zoom access token...', {
    hasCachedToken: !!accessTokenCache.token,
    tokenExpired: accessTokenCache.expiresAt ? accessTokenCache.expiresAt <= Date.now() : 'no-expiry',
    credentialsPresent: {
      clientId: !!ZOOM_CLIENT_ID,
      clientSecret: !!ZOOM_CLIENT_SECRET,
      accountId: !!ZOOM_ACCOUNT_ID
    }
  });
  
  // Check if we have a valid cached token
  if (accessTokenCache.token && accessTokenCache.expiresAt > Date.now()) {
    console.log('✅ Using cached Zoom token');
    return accessTokenCache.token;
  }

  try {
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Missing Zoom API credentials in environment variables');
    }
    
    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    
    console.log('🌐 Making Zoom OAuth request...');
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
    
    console.log('✅ Zoom access token obtained successfully', {
      tokenLength: access_token?.length,
      expiresIn: expires_in
    });
    
    // Cache the token
    accessTokenCache = {
      token: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - 60000 // Subtract 1 minute for safety
    };

    return access_token;
  } catch (error) {
    console.error('❌ Error getting Zoom access token:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw new Error('Failed to authenticate with Zoom API');
  }
};

// @desc    Create a new Zoom meeting
// @route   POST /api/zoom/create-meeting
// @access  Private (Premium users only)
exports.createMeeting = async (req, res) => {
  console.log('🎥 Zoom Meeting Creation Request:', {
    userId: req.user._id,
    requestBody: req.body,
    hasZoomCredentials: {
      clientId: !!ZOOM_CLIENT_ID,
      clientSecret: !!ZOOM_CLIENT_SECRET,
      accountId: !!ZOOM_ACCOUNT_ID
    }
  });
  
  try {
    const userId = req.user._id;
    
    // Check if user is premium
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('👤 User plan check:', {
      userId: user._id,
      currentPlan: user.plan,
      isPremium: user.plan === 'premium' || user.plan === 'pro'
    });
    
    if (user.plan !== 'premium' && user.plan !== 'pro') {
      console.log('❌ User not premium - access denied');
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
    
    console.log('🔑 Getting Zoom access token...');
    const accessToken = await getZoomAccessToken();
    console.log('✅ Access token obtained, creating meeting...');
    
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
    
    console.log('📅 Creating Zoom meeting with data:', {
      topic: meetingData.topic,
      type: meetingData.type,
      duration: meetingData.duration,
      hasStartTime: !!meetingData.start_time,
      hasPassword: !!meetingData.password
    });
    
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

// @desc    Generate Zoom SDK signature
// @route   POST /api/zoom/signature
// @access  Private (Premium users only)
exports.generateSignature = async (req, res) => {
  try {
    const userId = req.user._id;
    const { meetingNumber, role = 0 } = req.body;
    
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
    
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Zoom SDK credentials not configured' });
    }
    
    const timestamp = new Date().getTime() - 30000; // 30 seconds ago to account for clock skew
    const msg = Buffer.from(ZOOM_CLIENT_ID + meetingNumber + timestamp + role, 'utf8');
    const hash = crypto.createHmac('sha256', ZOOM_CLIENT_SECRET).update(msg).digest('base64');
    const signature = Buffer.from(`${ZOOM_CLIENT_ID}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    
    console.log('✅ Zoom SDK signature generated for meeting:', meetingNumber);
    
    res.json({ signature });
    
  } catch (error) {
    console.error('Error generating Zoom signature:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate meeting signature',
      error: error.message 
    });
  }
};

// @desc    Notify Wali about video call
// @route   POST /api/zoom/notify-wali
// @access  Private (Premium users only)
exports.notifyWali = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId, status, duration = 0, meetingId } = req.body;
    
    // Get user and recipient details
    const user = await User.findById(userId);
    const recipient = await User.findById(recipientId);
    
    if (!user || !recipient) {
      return res.status(404).json({ message: 'User or recipient not found' });
    }
    
    // Determine which user is female to get Wali email
    const femaleUser = user.gender === 'female' ? user : recipient;
    
    if (!femaleUser.waliDetails) {
      console.log('No Wali details found for female user');
      return res.json({ message: 'No Wali details configured' });
    }
    
    let waliEmail;
    try {
      const waliDetails = typeof femaleUser.waliDetails === 'string' 
        ? JSON.parse(femaleUser.waliDetails) 
        : femaleUser.waliDetails;
      waliEmail = waliDetails.email;
    } catch (parseError) {
      console.error('Error parsing Wali details:', parseError);
      return res.status(400).json({ message: 'Invalid Wali details format' });
    }
    
    if (!waliEmail) {
      console.log('No Wali email found in details');
      return res.json({ message: 'No Wali email configured' });
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email content based on call status
    const isCallStart = status === 'started';
    const subject = `Quluub Video Call ${isCallStart ? 'Started' : 'Ended'} - ${femaleUser.fname}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5aa0; margin-bottom: 10px;">🎥 Quluub Video Call ${isCallStart ? 'Started' : 'Ended'}</h1>
            <p style="color: #666; font-size: 16px;">Islamic Marriage Platform - Wali Supervision Notice</p>
          </div>
          
          <div style="background-color: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2c5aa0; margin-top: 0;">📋 Call Details</h3>
            <p><strong>👤 Participants:</strong> ${user.fname} ${user.lname} & ${recipient.fname} ${recipient.lname}</p>
            <p><strong>⏰ ${isCallStart ? 'Started' : 'Ended'} At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>🆔 Meeting ID:</strong> ${meetingId || 'N/A'}</p>
            ${!isCallStart ? `<p><strong>⏱️ Duration:</strong> ${Math.floor(duration / 60)}m ${duration % 60}s</p>` : ''}
            <p><strong>🏢 Platform:</strong> Zoom Professional</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0;">🕌 Islamic Compliance Notice</h3>
            <p style="color: #856404; margin-bottom: 10px;">This video call is being conducted under Islamic guidelines with proper supervision.</p>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li>Professional Zoom platform ensures secure communication</li>
              <li>Call details are automatically logged for transparency</li>
              <li>Duration is limited to maintain appropriate interaction</li>
              <li>Both parties are aware of Wali oversight</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #0c5460; margin-top: 0;">💬 Continue Supervision</h3>
            <p style="color: #0c5460;">You can also monitor their chat conversations through your supervision link.</p>
            <p style="color: #0c5460;"><strong>Chat Supervision:</strong> Available in your Wali dashboard</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">This is an automated notification from Quluub</p>
            <p style="color: #666; font-size: 14px;">🌙 Connecting Hearts, Honoring Faith 🌙</p>
          </div>
        </div>
      </div>
    `;
    
    // Send email to Wali
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: waliEmail,
      subject: subject,
      html: htmlContent
    });
    
    console.log(`✅ Wali notification sent for video call ${status}:`, waliEmail);
    
    res.json({ 
      message: 'Wali notification sent successfully',
      status: status,
      waliNotified: true
    });
    
  } catch (error) {
    console.error('Error notifying Wali about video call:', error.message);
    res.status(500).json({ 
      message: 'Failed to notify Wali',
      error: error.message 
    });
  }
};

// Functions are already exported using exports.functionName above
// No need for module.exports since we're using exports.functionName syntax
