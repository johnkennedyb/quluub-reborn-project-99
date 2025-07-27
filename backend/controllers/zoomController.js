const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Call = require('../models/Call');
const nodemailer = require('nodemailer');

// Zoom API configuration (JWT-based with provided credentials)
const ZOOM_SDK_KEY = process.env.ZOOM_SDK_KEY;
const ZOOM_SDK_SECRET = process.env.ZOOM_SDK_SECRET;
const ZOOM_API_KEY = process.env.ZOOM_API_KEY || 'xO1VYDPwScOmsnNN3CkkuQ';
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET || 'Eg6W8odLNcGkZhZ4z6m8gZoH1ZJlJmqcxrOf';
const ZOOM_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN || '02VAnUbtTny7Qku1md-lpQ';
const ZOOM_VERIFICATION_TOKEN = process.env.ZOOM_VERIFICATION_TOKEN || 'K9Tnwzk2SUeN4ksQ0_G6KQ';
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const MEETING_DURATION_MINUTES = 5; // 5-minute limit

// Generate JWT token for Zoom API authentication
const generateZoomJWT = () => {
  const payload = {
    iss: ZOOM_API_KEY,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };
  
  return jwt.sign(payload, ZOOM_API_SECRET);
};

// Generate SDK JWT for client-side Zoom Video SDK
const generateZoomSDKJWT = (sessionName, role = 1) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour
  
  // Ensure sessionName is a string
  const sessionNameStr = String(sessionName);
  
  const payload = {
    iss: ZOOM_SDK_KEY,
    exp,
    iat,
    aud: 'zoom',
    appKey: ZOOM_SDK_KEY,
    tokenExp: exp,
    sessionName: sessionNameStr,
    roleType: role
  };
  
  console.log('🔑 JWT Payload for Video SDK:', JSON.stringify(payload, null, 2));
  return jwt.sign(payload, ZOOM_SDK_SECRET, { algorithm: 'HS256' });
};


// Send notification to Wali about video call
const sendWaliVideoCallNotification = async (hostUserId, participantUserId, meetingDetails) => {
  try {
    const [hostUser, participantUser] = await Promise.all([
      User.findById(hostUserId),
      User.findById(participantUserId)
    ]);

    if (!hostUser || !participantUser) {
      console.error('Users not found for Wali notification');
      return;
    }

    // Notify host's Wali if female
    if (hostUser.gender === 'female' && hostUser.waliDetails) {
      try {
        const waliDetails = JSON.parse(hostUser.waliDetails);
        if (waliDetails.email) {
          await sendWaliNotificationEmail(
            waliDetails.email,
            waliDetails.name || 'Wali',
            hostUser.fname,
            participantUser.fname,
            meetingDetails
          );
        }
      } catch (e) {
        console.error('Error parsing host wali details:', e);
      }
    }

    // Notify participant's Wali if female
    if (participantUser.gender === 'female' && participantUser.waliDetails) {
      try {
        const waliDetails = JSON.parse(participantUser.waliDetails);
        if (waliDetails.email) {
          await sendWaliNotificationEmail(
            waliDetails.email,
            waliDetails.name || 'Wali',
            participantUser.fname,
            hostUser.fname,
            meetingDetails
          );
        }
      } catch (e) {
        console.error('Error parsing participant wali details:', e);
      }
    }
  } catch (error) {
    console.error('Error sending Wali notification:', error);
  }
};

// Send email notification to Wali
const sendWaliNotificationEmail = async (waliEmail, waliName, userFname, partnerFname, meetingDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const emailContent = `
      <h2>🎥 Video Call Notification - Islamic Supervision</h2>
      <p>Dear ${waliName},</p>
      <p>This is to inform you that <strong>${userFname}</strong> is about to have a video call with <strong>${partnerFname}</strong> on the Quluub platform.</p>
      
      <h3>📋 Call Details:</h3>
      <ul>
        <li><strong>Meeting ID:</strong> ${meetingDetails.meetingId}</li>
        <li><strong>Duration Limit:</strong> ${MEETING_DURATION_MINUTES} minutes</li>
        <li><strong>Start Time:</strong> ${new Date(meetingDetails.startTime).toLocaleString()}</li>
        <li><strong>Topic:</strong> ${meetingDetails.topic}</li>
      </ul>
      
      <h3>🔗 Supervision Link:</h3>
      <p>You can monitor this call using the following link:</p>
      <p><a href="${meetingDetails.joinUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Call for Supervision</a></p>
      
      <h3>📹 Recording Information:</h3>
      <p>This call will be automatically recorded and the recording will be sent to you after the call ends for your review.</p>
      
      <p><em>This is an automated notification from Quluub's Islamic compliance system.</em></p>
      <p>May Allah bless your supervision and guidance.</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: waliEmail,
      subject: `🎥 Video Call Notification - ${userFname} & ${partnerFname}`,
      html: emailContent
    });

    console.log(`Wali notification sent to ${waliEmail}`);
  } catch (error) {
    console.error('Error sending Wali email:', error);
  }
};

// @desc    Create a Zoom Video SDK session
// @route   POST /api/zoom/create-meeting
// @access  Private (Premium users only)
exports.createMeeting = async (req, res) => {
  console.log('🎥 Zoom Meeting Creation Request:', {
    userId: req.user._id,
    requestBody: req.body,
    hasAPICredentials: {
      apiKey: !!ZOOM_API_KEY,
      apiSecret: !!ZOOM_API_SECRET
    }
  });
  
  try {
    const userId = req.user._id;
    const { topic = 'Quluub Video Call', duration = 5, waiting_room = false, join_before_host = true } = req.body;
    
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
    
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Fetch participant details
    const participant = await User.findById(participantId).select('fname lname email');
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    const participantName = participant.fname || 'Chat Partner';
    
    console.log('🔄 Creating Zoom SDK session...');
    // Generate unique session identifiers
    const sessionNumber = Math.floor(Math.random() * 1000000000);
    const sessionName = `QuluubCall_${userId}_${participantId}_${Date.now()}`;
    
    // Create a call record in database
    const callRecord = new Call({
      caller: userId,
      recipient: participantId,
      roomId: sessionName,
      status: 'ringing',
      startedAt: new Date(),
      duration: 0
    });
    
    await callRecord.save();
    
    // Generate session data for Zoom Video SDK
    const sdkJWT = generateZoomSDKJWT(sessionNumber, 1);
    const sessionData = {
      callId: callRecord._id,
      sessionName: sessionName,
      sessionNumber: sessionNumber,
      topic: `${topic} - ${user.fname} & ${participantName}`,
      userName: user.fname || 'User',
      userEmail: user.email,
      participantName: participantName,
      participantId: participantId,
      sdkJWT: sdkJWT,
      sdkKey: ZOOM_SDK_KEY,
      leaveUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/messages`
    };
    
    console.log('✅ Zoom SDK session created:', {
      callId: callRecord._id,
      sessionName: sessionData.sessionName,
      useWebRTC: true
    });
    
    // Fire-and-forget Wali notification (don’t block on failures)
    sendWaliVideoCallNotification(userId, participantId, {
      meetingId: sessionData.sessionName,
      joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/video-call/${sessionData.sessionName}`,
      startTime: new Date().toISOString(),
      topic: sessionData.topic
    }).catch(err => console.error('Error sending Wali notification:', err));
    
    // Return Zoom SDK session data
    res.json(sessionData);
    
  } catch (error) {
    console.error('❌ Error creating Zoom meeting:', {
  stack: error.stack,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? {
          'Authorization': error.config.headers['Authorization']?.substring(0, 20) + '...',
          'Content-Type': error.config.headers['Content-Type']
        } : 'No headers'
      }
    });
    
    // Check if it's a Zoom API error
    if (error.response?.status === 400) {
      console.error('🚫 Zoom API 400 Error - Possible causes:');
      console.error('1. Invalid API credentials (Video SDK vs REST API account)');
      console.error('2. Account does not support REST API meeting creation');
      console.error('3. JWT token format or expiration issue');
      console.error('4. Meeting data format issue');
      
      if (error.response.data) {
        console.error('Zoom API Error Details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to create Zoom meeting',
      error: error.message,
      zoomError: error.response?.data || 'No additional details',
      suggestion: error.response?.status === 400 ? 
        'API credentials may be for Video SDK account, not REST API account' : 
        'Check Zoom API credentials and account permissions'
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

// @desc    Generate Video SDK JWT for frontend
// @route   POST /api/zoom/get-sdk-token
// @access  Private (Premium users only)
exports.getSDKToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionKey, role = 1 } = req.body;
    
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
    
    if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
      return res.status(500).json({ message: 'Zoom SDK credentials not configured' });
    }
    
    // Generate Video SDK JWT
    const sdkJWT = generateZoomSDKJWT(sessionKey, role);
    
    console.log('✅ Video SDK JWT generated for session:', sessionKey);
    console.log('🔑 SDK Key being used:', ZOOM_SDK_KEY);
    
    res.json({ 
      sdkJWT,
      sessionKey,
      sdkKey: ZOOM_SDK_KEY
    });
    
  } catch (error) {
    console.error('Error generating Video SDK JWT:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate Video SDK JWT',
      error: error.message 
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
    
    if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
      return res.status(500).json({ message: 'Zoom SDK credentials not configured' });
    }
    
    const timestamp = new Date().getTime() - 30000; // 30 seconds ago to account for clock skew
    const msg = Buffer.from(ZOOM_SDK_KEY + meetingNumber + timestamp + role, 'utf8');
    const hash = crypto.createHmac('sha256', ZOOM_SDK_SECRET).update(msg).digest('base64');
    const signature = Buffer.from(`${ZOOM_SDK_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    
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
    const transporter = nodemailer.createTransport({
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
