const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { sendVideoCallNotificationEmail } = require('../utils/emailService');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Upload video call recording
const uploadRecording = async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No recording file provided' });
    }

    if (!callId) {
      return res.status(400).json({ message: 'Call ID is required' });
    }

    // Generate public URL for the recording
    const recordingUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/recordings/${req.file.filename}`;
    
    console.log('📹 Recording uploaded:', {
      callId,
      userId,
      filename: req.file.filename,
      size: req.file.size,
      recordingUrl
    });

    // Send recording to Wali emails
    await sendRecordingToWali(userId, callId, recordingUrl);

    res.json({
      message: 'Recording uploaded successfully',
      recordingUrl,
      callId,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('❌ Error uploading recording:', error);
    res.status(500).json({ 
      message: 'Failed to upload recording', 
      error: error.message 
    });
  }
};

// Helper function to send recording to Wali
const sendRecordingToWali = async (userId, callId, recordingUrl) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Parse call ID to get caller and recipient info
    const [callerId, recipientId] = callId.split('-');
    const [caller, recipient] = await Promise.all([
      User.findById(callerId),
      User.findById(recipientId)
    ]);

    if (!caller || !recipient) return;

    const callDetails = {
      callerName: caller.fname,
      recipientName: recipient.fname,
      timestamp: new Date().toISOString(),
      callId: callId,
      recordingUrl: recordingUrl
    };

    const videoCallReportLink = `${process.env.FRONTEND_URL}/wali/video-call-report?caller=${callerId}&recipient=${recipientId}&callId=${callId}`;

    // Send to caller's wali if female and has wali details
    if (caller.gender === 'female' && caller.waliDetails) {
      try {
        const waliDetails = JSON.parse(caller.waliDetails);
        if (waliDetails.email) {
          await sendVideoCallNotificationEmail(
            waliDetails.email,
            waliDetails.name || 'Wali',
            caller.fname,
            recipient.fname,
            callDetails,
            videoCallReportLink
          );
          console.log('📧 Recording sent to caller\'s Wali:', waliDetails.email);
        }
      } catch (e) {
        console.error('Error parsing wali details for caller:', e);
      }
    }

    // Send to recipient's wali if female and has wali details
    if (recipient.gender === 'female' && recipient.waliDetails) {
      try {
        const waliDetails = JSON.parse(recipient.waliDetails);
        if (waliDetails.email) {
          await sendVideoCallNotificationEmail(
            waliDetails.email,
            waliDetails.name || 'Wali',
            recipient.fname,
            caller.fname,
            callDetails,
            videoCallReportLink
          );
          console.log('📧 Recording sent to recipient\'s Wali:', waliDetails.email);
        }
      } catch (e) {
        console.error('Error parsing wali details for recipient:', e);
      }
    }

  } catch (error) {
    console.error('❌ Error sending recording to Wali:', error);
  }
};

// Serve recording files
const serveRecording = (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/recordings', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Serve entire file
      const head = {
        'Content-Length': fileSize,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }

  } catch (error) {
    console.error('❌ Error serving recording:', error);
    res.status(500).json({ message: 'Error serving recording' });
  }
};

// Upload video call recording
router.post('/upload-recording', (req, res, next) => {
  upload.single('recording')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    authMiddleware(req, res, (authErr) => {
      if (authErr) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      uploadRecording(req, res);
    });
  });
});

// Serve recording files
router.get('/:filename', serveRecording);

module.exports = router;
