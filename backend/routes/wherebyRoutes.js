const express = require('express');
const axios = require('axios');
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { sendVideoCallNotificationEmail } = require('../utils/emailService');

const router = express.Router();

// Whereby API configuration
const WHEREBY_API_URL = 'https://api.whereby.dev/v1';
const WHEREBY_API_KEY = process.env.WHEREBY_API_KEY;

// Create Whereby meeting and send invitation
router.post('/create-meeting', protect, async (req, res) => {
  try {
    const { recipientId, callerName, callerAvatar } = req.body;
    const callerId = req.user.id;

    // Validate required fields
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: recipientId'
      });
    }

    // Get caller and recipient details
    const [caller, recipient] = await Promise.all([
      User.findById(callerId),
      User.findById(recipientId)
    ]);

    if (!caller || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'Caller or recipient not found'
      });
    }

    // Create Whereby meeting with explicit unlocked configuration
    const meetingData = {
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      isLocked: false, // Explicitly set to false for unlocked room
      roomMode: "normal", // Normal mode for direct joining
      roomNamePrefix: "quluub-call",
      roomNamePattern: "uuid",
      // Explicitly set all features to ensure no overrides
      features: {
        chat: true,
        raiseHand: true,
        recording: "cloud",
        video: true,
        fullscreen: true,
        participants: true,
        captions: true,
        breakout: false
      },
      // Recording configuration
      recording: {
        type: "cloud",
        destination: {
          provider: "whereby"
        },
        startTrigger: "automatic"
      },
      fields: [
        "hostRoomUrl",
        "roomUrl",
        "meetingId",
        "isLocked"
      ]
    };

    console.log('🚀 Creating Whereby meeting with data:', JSON.stringify(meetingData, null, 2));
    console.log('🔑 Using API Key:', WHEREBY_API_KEY ? 'Present' : 'Missing');
    console.log('🌐 API URL:', `${WHEREBY_API_URL}/meetings`);
    console.log('🔒 Current lock status in config:', meetingData.isLocked);

    try {
      console.log('🔍 Sending request to Whereby API...');
      
      const startTime = Date.now();
      const wherebyResponse = await axios.post(`${WHEREBY_API_URL}/meetings`, meetingData, {
        headers: {
          'Authorization': `Bearer ${WHEREBY_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whereby-Debug': 'true'  // Request debug info from Whereby
        },
        timeout: 10000  // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Whereby API Response (${responseTime}ms):`, {
        status: wherebyResponse.status,
        statusText: wherebyResponse.statusText,
        headers: wherebyResponse.headers,
        data: {
          ...wherebyResponse.data,
          // Don't log sensitive info
          hostRoomUrl: wherebyResponse.data.hostRoomUrl ? '***REDACTED***' : undefined,
          roomUrl: wherebyResponse.data.roomUrl ? '***REDACTED***' : undefined
        }
      });
      
      if (wherebyResponse.data.isLocked === undefined) {
        console.warn('⚠️ Whereby API did not return isLocked status in response');
      } else {
        console.log(`🔒 Whereby API response lock status: ${wherebyResponse.data.isLocked ? 'LOCKED' : 'UNLOCKED'}`);
      }

      const meeting = wherebyResponse.data;
      console.log('✅ Whereby meeting created:', meeting);

      // Create professional call data
      const callData = {
        callId: `whereby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        platform: 'whereby',
        meetingId: meeting.meetingId,
        roomUrl: meeting.roomUrl,
        hostRoomUrl: meeting.hostRoomUrl,
        callerId,
        recipientId,
        callerName: caller.fname,
        recipientName: recipient.fname,
        timestamp: new Date().toISOString(),
        status: 'initiated',
        endDate: meetingData.endDate
      };

      console.log('📞 Whereby meeting created:', {
        meetingId: meeting.meetingId,
        caller: caller.fname,
        recipient: recipient.fname,
        roomUrl: meeting.roomUrl
      });

      // Send call notification to Wali (guardian oversight) with chat link
      const chatLink = `${process.env.FRONTEND_URL}/chat?with=${recipientId}`;
      await sendWherebyCallNotificationToWali(caller, recipient, { ...callData, chatLink });

      // Store call data in chat for reference
      const chat = await Chat.findOne({
        participants: { $all: [callerId, recipientId] }
      });

      if (chat) {
        const chatLink = `${process.env.FRONTEND_URL}/chat?with=${recipientId}`;
        const chatMessage = new Chat({
          senderId: callerId,
          receiverId: recipientId,
          message: `🎥 Professional Whereby Video Call Invitation\n\n📞 Join Meeting: ${meeting.roomUrl}\n💬 Chat Link: ${chatLink}`,
          metadata: {
            type: 'video-call-invitation',
            platform: 'whereby',
            callId: callData.callId,
            meetingId: meeting.meetingId,
            roomUrl: meeting.roomUrl,
            chatLink: chatLink,
            status: 'initiated'
          },
          timestamp: new Date()
        });
        await chatMessage.save();
        
        // Send chat invitation via socket if recipient is online
        const io = req.app.get('io');
        if (io) {
          const sockets = await io.fetchSockets();
          const recipientSocket = sockets.find(socket => socket.userId === recipientId);
          
          if (recipientSocket) {
            io.to(recipientSocket.id).emit('new_message', {
              _id: chatMessage._id,
              senderId: callerId,
              receiverId: recipientId,
              message: chatMessage.message,
              messageType: 'video-call-invitation',
              metadata: chatMessage.metadata,
              timestamp: chatMessage.timestamp
            });
            console.log('📨 Video call invitation with chat link sent to recipient via socket');
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Whereby meeting created successfully',
        callData,
        meeting: {
          meetingId: meeting.meetingId,
          roomUrl: meeting.roomUrl,
          hostRoomUrl: meeting.hostRoomUrl
        }
      });

    } catch (error) {
      console.error('❌ Whereby API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to create Whereby meeting',
        error: error.message,
        details: error.response?.data || 'No additional details'
      });
    }

  } catch (error) {
    console.error('❌ Error creating Whereby meeting:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create Whereby meeting',
      error: error.response?.data?.message || error.message,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        apiUrl: `${WHEREBY_API_URL}/meetings`
      }
    });
  }
});

// Report video call recording to Wali
router.post('/video-call-recording', protect, async (req, res) => {
  try {
    const { callData, recordingUrl, platform } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!callData || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: callData, platform'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('📹 Whereby call recording reported:', {
      callId: callData.callId,
      user: user.fname,
      recordingUrl: recordingUrl || 'Whereby cloud recording',
      platform
    });

    // Send recording to Wali for Islamic compliance oversight
    await sendWherebyRecordingToWali(user, callData, recordingUrl);

    res.status(200).json({
      success: true,
      message: 'Video call recording reported to Wali successfully'
    });

  } catch (error) {
    console.error('❌ Error reporting Whereby recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report video call recording',
      error: error.message
    });
  }
});

// Get meeting details
router.get('/meeting/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const response = await axios.get(`${WHEREBY_API_URL}/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${WHEREBY_API_KEY}`
      }
    });

    res.status(200).json({
      success: true,
      meeting: response.data
    });

  } catch (error) {
    console.error('❌ Error fetching Whereby meeting:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting details',
      error: error.response?.data?.message || error.message
    });
  }
});

// Helper function to send Whereby call notification to Wali
async function sendWherebyCallNotificationToWali(caller, recipient, callData) {
  try {
    // Get the female user to find Wali email
    const femaleUser = caller.gender === 'female' ? caller : recipient;
    
    // Parse waliDetails JSON to get email
    let waliEmail = null;
    if (femaleUser.waliDetails) {
      try {
        const waliDetails = JSON.parse(femaleUser.waliDetails);
        waliEmail = waliDetails.email;
      } catch (error) {
        console.error('❌ Error parsing waliDetails JSON:', error);
      }
    }
    
    if (!waliEmail) {
      console.log('⚠️ No Wali email found in female user profile');
      return;
    }
    
    const waliEmails = [waliEmail];
    
    // Generate Wali-specific links for monitoring
    const waliChatViewLink = `${process.env.FRONTEND_URL}/wali/chat-view?caller=${callData.callerId}&recipient=${callData.recipientId}&callId=${callData.callId}`;
    const waliVideoReportLink = `${process.env.FRONTEND_URL}/wali/video-call-report?callId=${callData.callId}&platform=whereby`;

    const emailData = {
      to: waliEmails,
      subject: `🎥 Quluub Video Call Notification - ${callData.callerName} & ${callData.recipientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎥 Video Call Notification</h1>
            <p style="color: #e8f4fd; margin: 10px 0 0 0;">Whereby Professional Platform</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">📞 Call Details</h2>
            
            <div style="background: #f1f3f4; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p><strong>Platform:</strong> Whereby Professional</p>
              <p><strong>Call ID:</strong> ${callData.callId}</p>
              <p><strong>Meeting ID:</strong> ${callData.meetingId}</p>
              <p><strong>Participants:</strong> ${callData.callerName} & ${callData.recipientName}</p>
              <p><strong>Call Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${callData.roomUrl}" style="background: #4285f4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">🎥 Join Call</a>
              <br><br>
              <a href="${callData.chatLink || '#'}" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">💬 View Chat</a>
              <br><br>
              <a href="${waliChatViewLink}" style="background: #17a2b8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">👁️ Wali Chat Monitor</a>
              <br><br>
              <a href="${waliVideoReportLink}" style="background: #6f42c1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">📊 Video Call Report</a>
            </div>
            
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #e65100;">🛡️ Wali Supervision Access</h3>
              <p style="margin: 5px 0;">• <strong>Chat Monitor:</strong> View complete conversation history</p>
              <p style="margin: 5px 0;">• <strong>Video Report:</strong> Access call recordings and details</p>
              <p style="margin: 5px 0;">• <strong>Real-time Access:</strong> Monitor ongoing conversations</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; text-align: center; color: #2e7d32;">
                <strong>بسم الله الرحمن الرحيم</strong><br>
                This call will be automatically recorded for Islamic compliance and proper supervision.<br>
                Chat history and recordings are available for Wali oversight.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Quluub - Islamic Marriage Platform | Automated Wali Notification System</p>
          </div>
        </div>
      `
    };

    await sendVideoCallNotificationEmail(emailData);
    console.log('✅ Whereby call notification with chat links sent to Wali successfully');

  } catch (error) {
    console.error('❌ Error sending Whereby call notification to Wali:', error);
  }
}

// Helper function to send Whereby recording to Wali
async function sendWherebyRecordingToWali(user, callData, recordingUrl) {
  try {
    // Get the female user to find Wali email
    const [caller, recipient] = await Promise.all([
      User.findById(callData.callerId),
      User.findById(callData.recipientId)
    ]);
    
    const femaleUser = caller.gender === 'female' ? caller : recipient;
    
    // Parse waliDetails JSON to get email
    let waliEmail = null;
    if (femaleUser.waliDetails) {
      try {
        const waliDetails = JSON.parse(femaleUser.waliDetails);
        waliEmail = waliDetails.email;
      } catch (error) {
        console.error('❌ Error parsing waliDetails JSON for recording:', error);
      }
    }
    
    if (!waliEmail) {
      console.log('⚠️ No Wali email found in female user profile for recording');
      return;
    }
    
    const waliEmails = [waliEmail];

    const emailData = {
      to: waliEmails,
      subject: `🎥 Quluub Video Call Recording - ${callData.callerName} & ${callData.recipientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎥 Video Call Recording Available</h1>
            <p style="color: #e8f4fd; margin: 10px 0 0 0;">Whereby Cloud Recording</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">📹 Call Recording Details</h2>
            
            <div style="background: #f1f3f4; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p><strong>Platform:</strong> Whereby Professional</p>
              <p><strong>Call ID:</strong> ${callData.callId}</p>
              <p><strong>Meeting ID:</strong> ${callData.meetingId}</p>
              <p><strong>Participants:</strong> ${callData.callerName} & ${callData.recipientName}</p>
              <p><strong>Recording Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${recordingUrl ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${recordingUrl}" style="background: #f44336; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">🎥 View Recording</a>
            </div>
            ` : `
            <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Note:</strong> Recording is being processed by Whereby's cloud system. You will receive the recording link once processing is complete.</p>
            </div>
            `}
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; text-align: center; color: #2e7d32;">
                <strong>بسم الله الرحمن الرحيم</strong><br>
                This recording is provided for Islamic compliance and proper supervision purposes.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Quluub - Islamic Marriage Platform | Automated Recording System</p>
          </div>
        </div>
      `
    };

    await sendVideoCallNotificationEmail(emailData);
    console.log('✅ Whereby recording notification sent to Wali successfully');

  } catch (error) {
    console.error('❌ Error sending Whereby recording notification to Wali:', error);
  }
}

module.exports = router;