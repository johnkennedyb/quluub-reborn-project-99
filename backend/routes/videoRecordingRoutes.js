const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { upload, uploadVideoRecording, downloadVideoRecording } = require('../controllers/videoRecordingController');

// Upload video recording and notify Wali
router.post('/upload-recording', protect, upload.single('recording'), uploadVideoRecording);

// Download video recording (for Wali access)
router.get('/download/:filename', downloadVideoRecording);

module.exports = router;
